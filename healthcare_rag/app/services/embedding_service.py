import google.generativeai as genai
from app.core.config import get_settings


class EmbeddingService:
    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = "models/text-embedding-004"

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        response = genai.embed_content(
            model=self.model,
            content=texts,
        )
        # response["embedding"] is a list of embeddings when content is a list of strings
        return response["embedding"]