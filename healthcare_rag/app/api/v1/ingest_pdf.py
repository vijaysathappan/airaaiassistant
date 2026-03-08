from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.document_service import DocumentService
import os
import uuid

router = APIRouter()


@router.post("/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):

    temp_filename = f"temp_{uuid.uuid4()}.pdf"

    with open(temp_filename, "wb") as f:
        f.write(await file.read())

    document = await DocumentService.ingest_pdf(
        db=db,
        file_path=temp_filename,
        title=file.filename
    )

    os.remove(temp_filename)

    return {"message": "PDF ingested successfully", "document_id": str(document.id)}