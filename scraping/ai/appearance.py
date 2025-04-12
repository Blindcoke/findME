import base64
import logging
from pydantic import BaseModel
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class FaceDescription(BaseModel):
    appearance: str
    embedding: list


async def create_embedding(text: str, openai_client: AsyncOpenAI) -> list:
    try:
        embedding_response = await openai_client.embeddings.create(
            input=[text], model="text-embedding-3-small"
        )
        return embedding_response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding creation error: {e}")
        return []


async def analyze_face(
    image_data: bytes, openai_client: AsyncOpenAI
) -> FaceDescription:
    try:
        base64_image = base64.b64encode(image_data).decode("utf-8")
        image_url = f"data:image/jpeg;base64,{base64_image}"

        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Ви опишете зовнішність людини на зображенні українською мовою. "
                        "Надайте короткий опис: вік, стать, волосся, очі, обличчя. "
                        "Це фото військового, тому не описуй одяг, зброю чи фон. "
                        "Концентруйся на рисах обличчя, кольорі волосся та очей. "
                        "Опишіть лише те, що видно. Без вступу, просто опис."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Опишіть цю людину коротким абзацом."},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                },
            ],
            max_tokens=300,
        )

        appearance_text = response.choices[0].message.content.strip()
        embedding = await create_embedding(appearance_text, openai_client)

        logger.info("Face analysis and embedding successful.")
        return FaceDescription(appearance=appearance_text, embedding=embedding)

    except Exception as e:
        logger.error(f"Face analysis error: {e}")
        return FaceDescription(
            appearance="Не вдалося розпізнати обличчя на зображенні. Спробуйте інше фото.",
            embedding=[],
        )
