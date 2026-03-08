from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.rag_service import RAGService

router = APIRouter()


@router.post("/query")
async def query_rag(
    query: str,
    db: AsyncSession = Depends(get_db),
):
    result = await RAGService.answer_question(db, query)
    return result