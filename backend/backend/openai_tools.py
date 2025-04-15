from openai import AsyncOpenAI
from django.conf import settings
import numpy as np
from .models import Captive
from .serializers import CaptiveSerializer
from asgiref.sync import sync_to_async

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def create_embedding(text: str) -> list:
    embedding_response = await openai_client.embeddings.create(
        input=[text],
        model="text-embedding-3-small",
    )
    return embedding_response.data[0].embedding


async def search(embedding: list, request) -> list:
    query_embedding = np.array(embedding)
    query_embedding_normalized = (
        query_embedding / np.linalg.norm(query_embedding)
        if np.any(query_embedding)
        else query_embedding
    )

    captives = await sync_to_async(
        lambda: list(Captive.objects.exclude(appearance_embedded__isnull=True))
    )()

    captive_data = await sync_to_async(
        lambda: [(c, c.appearance_embedded) for c in captives]
    )()

    results = []
    for captive, vector_string in captive_data:
        if not vector_string:
            continue

        vector_string = vector_string.strip("[]")
        if not vector_string or "," not in vector_string:
            continue

        try:
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
        except Exception:
            continue

    top_matches = sorted(results, key=lambda x: x[0], reverse=True)[:5]

    for sim, c in top_matches:
        c._similarity = sim

    return await sync_to_async(
        lambda: CaptiveSerializer(
            [c for _, c in top_matches], many=True, context={"request": request}
        ).data
    )()
