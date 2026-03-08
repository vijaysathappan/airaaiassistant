from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.ingest import router as ingest_router
from app.db.session import engine
from app.db.models import Base
from app.api.v1.query import router as query_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.ingest_pdf import router as ingest_pdf_router

app = FastAPI(title="Healthcare Hybrid RAG")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(ingest_router, prefix="/api/v1")
app.include_router(query_router, prefix="/api/v1")
app.include_router(metrics_router, prefix="/api/v1")
app.include_router(ingest_pdf_router, prefix="/api/v1")

@app.on_event("startup")
async def startup() -> None:
    print("LOADED POSTGRES URL:", engine.url)
    async with engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)
        # Simple connectivity check
        await conn.execute(text("SELECT 1"))
    print("Database Connected Successfully")
