from openai import AsyncOpenAI
from django.conf import settings
import numpy as np
from .models import Captive
from .serializers import CaptiveSerializer
from asgiref.sync import sync_to_async
import io
import tempfile
from deepface import DeepFace
from PIL import Image
from django.db.models import Q

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
BATCH_SIZE = 1000
MODEL_DIMENSIONS = {
    "picture_embedded": 128,
    "appearance_embedded": 1536,
}


async def create_embedding(text: str) -> list:
    response = await openai_client.embeddings.create(
        input=[text],
        model="text-embedding-3-small",
    )
    return response.data[0].embedding


async def create_photo_embedding(image_bytes: bytes) -> list[float]:
    with Image.open(io.BytesIO(image_bytes)) as img:
        with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
            img.save(tmp.name)
            result = DeepFace.represent(
                img_path=tmp.name,
                model_name="SFace",
                enforce_detection=False,
                detector_backend="opencv",
            )
            return result[0]["embedding"] if result else []


def apply_status_filter(qs, status: str):
    if not status:
        return qs

    statuses = status.split("|") if "|" in status else [status]
    return qs.filter(Q(status__in=statuses))


async def async_batches(qs, batch_size: int):
    total = await sync_to_async(qs.count)()
    for offset in range(0, total, batch_size):
        batch = await sync_to_async(list)(qs[offset : offset + batch_size])
        yield batch


async def search_by_embedding(
    query_embedding: list[float], request, status: str, field_name: str
) -> list:
    expected_dim = MODEL_DIMENSIONS[field_name]
    query_vec = np.asarray(query_embedding, dtype=np.float32)
    if len(query_vec) != expected_dim:
        raise ValueError(
            f"Query embedding dimension mismatch for {field_name}. "
            f"Expected {expected_dim}, got {len(query_vec)}"
        )
    query_norm = np.linalg.norm(query_vec)
    query_vec = query_vec / query_norm if query_norm > 0 else query_vec
    qs = Captive.objects.exclude(**{f"{field_name}__isnull": True})
    qs = apply_status_filter(qs, status)
    top_matches = []
    async for batch in async_batches(qs, BATCH_SIZE):
        batch_matches = await process_batch(batch, field_name, query_vec, expected_dim)
        top_matches.extend(batch_matches)
        top_matches.sort(key=lambda x: x[0], reverse=True)
        top_matches = top_matches[:5]
    return await serialize_results([c for _, c in top_matches], request)


async def process_batch(
    batch, field_name: str, query_vec: np.ndarray, expected_dim: int
):
    valid_embeddings = []
    valid_captives = []
    for captive in batch:
        vec_str = getattr(captive, field_name)
        vec = parse_embedding(vec_str, expected_dim)

        if vec is not None:
            valid_embeddings.append(vec)
            valid_captives.append(captive)
    if not valid_embeddings:
        return []

    embeddings = np.array(valid_embeddings, dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embeddings_norm = embeddings / norms
    similarities = embeddings_norm.dot(query_vec)
    return list(zip(similarities.tolist(), valid_captives))


def parse_embedding(vec_str: str, expected_dim: int) -> np.ndarray | None:
    if not vec_str or vec_str.strip() == "[]":
        return None

    vec = np.fromstring(vec_str.strip("[]"), sep=",", dtype=np.float32)
    if len(vec) != expected_dim:
        return None
    return vec if vec.size > 0 else None


async def serialize_results(captives, request):
    return await sync_to_async(
        lambda: CaptiveSerializer(
            captives, many=True, context={"request": request}
        ).data
    )()


async def search_photo(embedding: list, request, status) -> list:
    return await search_by_embedding(embedding, request, status, "picture_embedded")


async def search_appearance(embedding: list, request, status) -> list:
    return await search_by_embedding(embedding, request, status, "appearance_embedded")
