from app.db.models import EvaluationLog


class LogService:

    @staticmethod
    async def log_evaluation(
        db,
        question: str,
        answer: str,
        faithfulness: float,
        recall: float,
        rag_score: float
    ):
        """
        Stores RAG evaluation metrics into database.
        """

        log = EvaluationLog(
            question=question,
            answer=answer,
            faithfulness_score=faithfulness,
            recall_score=recall,
            rag_score=rag_score
        )

        db.add(log)
        await db.commit()