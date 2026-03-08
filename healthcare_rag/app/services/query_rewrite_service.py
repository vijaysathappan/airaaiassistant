import google.generativeai as genai
from app.core.config import get_settings


class QueryRewriteService:

    @staticmethod
    async def rewrite(query: str) -> list[str]:

        settings = get_settings()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro")

        prompt = f"""
Generate 3 alternative search queries for the following medical question.
Keep them concise and semantically diverse.

Original Question:
{query}

Return each query on a new line.
"""

        response = await model.generate_content_async(prompt)
        output_text = response.text

        queries = [q.strip() for q in output_text.split("\n") if q.strip()]

        # include original query as well
        return [query] + queries[:3]