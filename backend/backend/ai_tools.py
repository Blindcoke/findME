from openai import AsyncOpenAI  # type: ignore
from django.conf import settings
import numpy as np
from .models import Captive
from .serializers import CaptiveSerializer
from asgiref.sync import sync_to_async  # type: ignore
import io
import tempfile
from deepface import DeepFace  # type: ignore
from PIL import Image
from django.db.models import Q


openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def create_embedding(text: str) -> list:
    embedding_response = await openai_client.embeddings.create(
        input=[text],
        model="text-embedding-3-small",
    )
    return embedding_response.data[0].embedding


async def create_photo_embedding(image_bytes: bytes) -> list[float] | None:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=True) as temp_file:
            image.save(temp_file.name)
            embedding_obj = DeepFace.represent(
                img_path=temp_file.name, model_name="SFace", enforce_detection=False
            )
        if embedding_obj:
            return embedding_obj[0]["embedding"]
        else:
            return None
    except Exception as e:
        print("Error in create_photo_embedding:", e)
        raise


async def search_by_embedding(
    embedding: list, request, status: str, field_name: str
) -> list:
    try:
        query_embedding = np.array(embedding)
        norm = np.linalg.norm(query_embedding)
        query_embedding_normalized = (
            query_embedding / norm
            if np.any(query_embedding) and norm > 0
            else query_embedding
        )

        exclude_filter = {f"{field_name}__isnull": True}
        captives_query = Captive.objects.exclude(**exclude_filter)
        if status:
            # Handle multiple statuses separated by |
            if "|" in status:
                statuses = status.split("|")
                status_filter = Q(status=statuses[0])
                for s in statuses[1:]:
                    status_filter |= Q(status=s)
                captives_query = captives_query.filter(status_filter)
            else:
                captives_query = captives_query.filter(status=status)

        captives = await sync_to_async(lambda: list(captives_query))()
        captive_data = await sync_to_async(
            lambda: [(c, getattr(c, field_name)) for c in captives]
        )()

        results = []
        for idx, (captive, vector_string) in enumerate(captive_data):
            if not vector_string:
                continue
            try:
                vector_string = vector_string.strip("[]")
                if not vector_string or "," not in vector_string:
                    continue

                captive_embedding = np.fromstring(vector_string, sep=",")

                if captive_embedding.size == 0:
                    continue
                norm_captive = np.linalg.norm(captive_embedding)
                if norm_captive > 0:
                    captive_embedding_normalized = captive_embedding / norm_captive
                    similarity = np.dot(
                        query_embedding_normalized, captive_embedding_normalized
                    )
                    results.append((similarity, captive))
            except Exception as e:
                print(
                    f"Error processing captive {getattr(captive, 'id', 'unknown')}: {e}"
                )
                continue
        top_matches = sorted(results, key=lambda x: x[0], reverse=True)[:5]

        for sim, c in top_matches:
            c._similarity = sim

        serialized_data = await sync_to_async(
            lambda: CaptiveSerializer(
                [c for _, c in top_matches], many=True, context={"request": request}
            ).data
        )()
        return serialized_data
    except Exception as e:
        return []


async def search_photo(embedding: list, request, status) -> list:
    return await search_by_embedding(embedding, request, status, "picture_embedded")


async def search_appearence(embedding: list, request, status) -> list:
    return await search_by_embedding(embedding, request, status, "appearance_embedded")
