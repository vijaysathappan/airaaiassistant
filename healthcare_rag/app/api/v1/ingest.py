from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.document_service import DocumentService

router = APIRouter(tags=["Ingest"])


@router.post("/ingest-test")
async def ingest_test(db: AsyncSession = Depends(get_db)):
    document = await DocumentService.create_document(
        db=db,
        title="Test Medical Article",
        source="WHO",
        chunks=[
            {"content": "Hypertension is high blood pressure.", "metadata": {"section": 1}},
            {"content": "Diabetes affects blood sugar levels.", "metadata": {"section": 2}},
        ],
    )
    return {"document_id": document.id}
