from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import EvaluationLog

router = APIRouter()


@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):

    result = await db.execute(
        select(
            func.count(EvaluationLog.id),
            func.avg(EvaluationLog.faithfulness_score),
            func.avg(EvaluationLog.recall_score),
            func.avg(EvaluationLog.rag_score)
        )
    )

    count, avg_faith, avg_recall, avg_rag = result.first()

    return {
        "total_queries": count or 0,
        "avg_faithfulness": float(avg_faith or 0),
        "avg_recall": float(avg_recall or 0),
        "avg_rag_score": float(avg_rag or 0)
    }