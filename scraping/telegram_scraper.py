import os
import asyncio
import logging
from datetime import datetime
from datetime import datetime, timezone, timedelta
from telethon.sync import TelegramClient
from telethon.errors import FloodWaitError, ApiIdInvalidError, PhoneNumberInvalidError
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from openai import AsyncOpenAI
from ai.appearance import analyze_face
from ai.extractor import extract_person_info


load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("telegram_scraper.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
PHONE = os.getenv("PHONE")
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")


class TelegramScraper:
    def __init__(self):
        self.client = TelegramClient("sessions/find_me.session", API_ID, API_HASH)
        self.conn = None
        self.cursor = None
        self.media_path = "../data/media/captives/"
        self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        os.makedirs(self.media_path, exist_ok=True)

    def connect_to_db(self):
        try:
            self.conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT,
            )
            self.cursor = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            logger.info("Connected to the database successfully")
        except Exception as e:
            logger.error(f"Error connecting to the database: {e}")
            raise

    async def save_photo(self, photo_data, captive_id):
        captive_dir = os.path.join(self.media_path, str(captive_id))
        os.makedirs(captive_dir, exist_ok=True)

        photo_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        photo_path = os.path.join(captive_dir, photo_name)
        print(f"Saving photo to {photo_path}")
        with open(photo_path, "wb") as f:
            f.write(photo_data)

        return f"captives/{captive_id}/{photo_name}"

    async def process_message(self, message, telegram_user_id):
        try:
            if not message.message:
                logger.info("Skipping message with no text content.")
                return

            extracted_info = await extract_person_info(message.message)

            if not extracted_info.name:
                logger.info("Skipping message - no name found.")
                return

            if extracted_info == "NO_RELEVANT_INFORMATION":
                logger.info("Skipping message - no relevant information found.")
                return

            self.cursor.execute(
                "SELECT * FROM backend_captive WHERE name = %s", (extracted_info.name,)
            )
            existing_record = self.cursor.fetchone()
            print(extracted_info)
            if existing_record:
                logger.info(
                    f"Record already exists for {extracted_info.name} Skipping."
                )
                return

            photo_path = None
            if message.media:
                photo_data = await self.client.download_media(message.media, bytes)
                if photo_data:
                    result = await analyze_face(photo_data, self.openai_client)
                    appearance = result.appearance
                    appearance_embedded = result.embedding
                    self.cursor.execute(
                        """
                        INSERT INTO backend_captive 
                        (name, person_type, brigade, settlement, status, circumstances, appearance, appearance_embedded, last_update, user_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                        """,
                        (
                            extracted_info.name,
                            extracted_info.person_type,
                            extracted_info.brigade,
                            extracted_info.settlement,
                            extracted_info.status,
                            extracted_info.circumstances,
                            appearance,
                            appearance_embedded,
                            datetime.now(),
                            telegram_user_id,
                        ),
                    )
                    new_id = self.cursor.fetchone()[0]
                    self.conn.commit()

                    photo_path = await self.save_photo(photo_data, new_id)
                    self.cursor.execute(
                        "UPDATE backend_captive SET picture = %s WHERE id = %s",
                        (photo_path, new_id),
                    )
                    self.conn.commit()

                    logger.info(
                        f"Created new captive record: {extracted_info.name} with photo"
                    )
            else:
                self.cursor.execute(
                    """
                    INSERT INTO backend_captive 
                    (name, person_type, brigade, settlement, status, circumstances, last_update, user_id) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        extracted_info.name,
                        extracted_info.person_type,
                        extracted_info.brigade,
                        extracted_info.settlement,
                        extracted_info.status,
                        extracted_info.circumstances,
                        datetime.now(),
                        telegram_user_id,
                    ),
                )
                self.conn.commit()
                logger.info(f"Created new record without photo: {extracted_info.name}")

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            self.conn.rollback()

    async def scrape_channel(self):
        try:
            self.connect_to_db()

            await self.client.start(phone=PHONE)
            if not await self.client.is_user_authorized():
                logger.error("User not authorized. Check your credentials.")
                return

            logger.info(f"Connected to Telegram. Scraping channel: {CHANNEL_USERNAME}")
            channel = await self.client.get_entity(CHANNEL_USERNAME)

            self.cursor.execute(
                "SELECT id FROM auth_user WHERE username = %s", ("Telegram_Channel",)
            )
            result = self.cursor.fetchone()

            if result is None:
                raise ValueError("Telegram_Channel user not found in auth_user table")

            telegram_user_id = result[0]

            async for message in self.client.iter_messages(
                channel,
                offset_date=datetime.now(tz=timezone.utc) - timedelta(hours=5),
                reverse=True,
                limit=5,
            ):
                try:
                    await self.process_message(message, telegram_user_id)
                except FloodWaitError as e:
                    logger.warning(f"Hit rate limit. Waiting {e.seconds} seconds")
                    await asyncio.sleep(e.seconds)

        except ApiIdInvalidError:
            logger.error("Invalid API ID or API Hash")
        except PhoneNumberInvalidError:
            logger.error("Invalid phone number format")
        except Exception as e:
            logger.error(f"Unexpected error in scrape_channel: {str(e)}")
        finally:
            if self.client:
                await self.client.disconnect()
            if self.conn:
                self.cursor.close()
                self.conn.close()
                logger.info("Database connection closed")


async def main():
    scraper = TelegramScraper()
    await scraper.scrape_channel()


if __name__ == "__main__":
    asyncio.run(main())
