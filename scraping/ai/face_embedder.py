import io
from deepface import DeepFace
from PIL import Image
import tempfile


def get_face_embedding(image_bytes: bytes) -> list[float] | None:
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
