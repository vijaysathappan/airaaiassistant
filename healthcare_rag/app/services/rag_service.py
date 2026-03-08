from app.services.retrieval_service import RetrievalService
from app.services.cache_service import CacheService
from app.services.evaluation_service import EvaluationService
from app.services.log_service import LogService
import google.generativeai as genai
from app.core.config import get_settings
import re
import json


class RAGService:

    @staticmethod
    async def answer_question(db, query: str):

        cache = CacheService()

        # 🔥 1️⃣ Normalize query for consistent caching
        normalized_query = re.sub(r"\W+", " ", query.lower()).strip()
        cache_key = f"rag:{normalized_query}"
        print("CACHE KEY:", cache_key)

        # 🔥 2️⃣ Check Cache FIRST
        cached = await cache.get(cache_key)
        if cached:
            print("CACHE HIT:", cache_key)

            # ✅ Log cached evaluation
            eval_data = cached.get("evaluation", {})
            faithfulness = eval_data.get("faithfulness", {}).get("faithfulness_score", 0)
            recall = eval_data.get("context_recall", {}).get("recall_score", 0)
            rag_score = eval_data.get("rag_score", 0)

            await LogService.log_evaluation(
                db=db,
                question=query,
                answer=cached.get("answer"),
                faithfulness=faithfulness,
                recall=recall,
                rag_score=rag_score
            )

            return cached

        # 🔥 3️⃣ Retrieval
        results = await RetrievalService.search(db, query)

        if not results:
            response = {
                "answer": "No relevant information found.",
                "sources": [],
                "evaluation": {
                    "faithfulness": {
                        "faithfulness_score": 0.0,
                        "explanation": "No context retrieved."
                    },
                    "context_recall": {
                        "recall_score": 0.0,
                        "explanation": "No context retrieved."
                    },
                    "rag_score": 0.0
                }
            }

            await cache.set(cache_key, response)

            await LogService.log_evaluation(
                db=db,
                question=query,
                answer=response["answer"],
                faithfulness=0.0,
                recall=0.0,
                rag_score=0.0
            )

            return response

        # 🔥 4️⃣ Build context
        context = "\n\n".join([r["content"] for r in results])

        # 🔥 5️⃣ Generate Answer
        prompt = f"""
You are an expert medical assistant performing a differential diagnosis or medical analysis.
Answer strictly using the provided context.
If the answer is not in the context, say you don't know.

Contrastive Prompting Instructions:
First, find and list the supporting evidence for the primary diagnosis or answer.
Second, search the context for any evidence that contradicts it or suggests an alternative diagnosis/answer.

Context:
{context}

Question:
{query}
"""

        settings = get_settings()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro")

        response = await model.generate_content_async(prompt)
        draft_answer = response.text.strip()

        # 🔥 Self-Correction Review Step
        review_prompt = f"""
You are a medical auditor. Review the following drafted answer against the provided context.
If the answer contains any hallucinated information not present in the context, correct it by removing the hallucinated parts or stating "I don't know".
Otherwise, output the original answer directly.

Context:
{context}

Draft Answer:
{draft_answer}

Provide only the final, corrected answer without extra commentary.
"""
        review_response = await model.generate_content_async(review_prompt)
        answer = review_response.text.strip()

        # 🔥 6️⃣ Faithfulness Evaluation
        evaluation_raw = await EvaluationService.evaluate_faithfulness(
            question=query,
            answer=answer,
            context=context
        )

        evaluation = RAGService._safe_json_parse(
            evaluation_raw,
            fallback_key="faithfulness_score"
        )

        # 🔥 7️⃣ Context Recall Evaluation
        recall_raw = await EvaluationService.evaluate_context_recall(
            question=query,
            context=context
        )

        recall = RAGService._safe_json_parse(
            recall_raw,
            fallback_key="recall_score"
        )

        # 🔥 8️⃣ Compute Final RAG Score
        faithfulness_score = float(evaluation.get("faithfulness_score", 0))
        recall_score = float(recall.get("recall_score", 0))
        rag_score = faithfulness_score * recall_score

        # 🔥 9️⃣ Final Response
        final_response = {
            "answer": answer,
            "sources": results,
            "evaluation": {
                "faithfulness": evaluation,
                "context_recall": recall,
                "rag_score": rag_score
            }
        }

        # 🔥 🔟 Log evaluation
        await LogService.log_evaluation(
            db=db,
            question=query,
            answer=answer,
            faithfulness=faithfulness_score,
            recall=recall_score,
            rag_score=rag_score
        )

        # 🔥 1️⃣1️⃣ Store in Cache
        await cache.set(cache_key, final_response)

        return final_response

    # --------------------------------------------------------
    # 🔥 SAFE JSON PARSER (Production Utility)
    # --------------------------------------------------------
    @staticmethod
    def _safe_json_parse(raw_text: str, fallback_key: str):
        cleaned = raw_text.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(cleaned)
        except Exception:
            return {
                fallback_key: 0,
                "explanation": "Evaluation parsing failed.",
                "raw_output": raw_text
            }