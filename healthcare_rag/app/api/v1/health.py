from fastapi import APIRouter, Depends
from app.core.config import get_settings, Settings

router = APIRouter()

@router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)):
    return {
        "status": "Healthcare RAG running",
        "environment": settings.ENVIRONMENT
    }