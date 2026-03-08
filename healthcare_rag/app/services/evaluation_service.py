import google.generativeai as genai
from app.core.config import get_settings


class EvaluationService:

    @staticmethod
    async def evaluate_faithfulness(question: str, answer: str, context: str):

        settings = get_settings()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro")

        prompt = f"""
You are evaluating a medical RAG system.

Rules:
1. The assistant must answer strictly using the context.
2. If the information is not in the context, the correct answer is "I don't know."
3. If the assistant correctly says "I don't know" because the context lacks the information,
   that is fully faithful.

Question:
{question}

Context:
{context}

Answer:
{answer}

Return ONLY valid JSON.

Format:
{{
  "faithfulness_score": 0 or 1,
  "explanation": "short explanation"
}}
"""

        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0,
                response_mime_type="application/json",
            )
        )

        return response.text
    
    @staticmethod
    async def evaluate_context_recall(question: str, context: str):

        settings = get_settings()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro")

        prompt = f"""
You are evaluating retrieval quality in a medical RAG system.

Question:
{question}

Retrieved Context:
{context}

Task:
Determine whether the retrieved context contains enough information to correctly answer the question.

If the context contains sufficient information → recall_score = 1  
If the context does NOT contain sufficient information → recall_score = 0  

Return ONLY valid JSON:

{{
  "recall_score": 0 or 1,
  "explanation": "short explanation"
}}
"""

        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0,
                response_mime_type="application/json",
            )
        )

        return response.text