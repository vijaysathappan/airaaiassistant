from sqlalchemy import Column, String, Text, ForeignKey, JSON, DateTime, Float, Uuid as UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import func
from sqlalchemy.types import UserDefinedType
import uuid

Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    source = Column(String, nullable=True)

    chunks = relationship(
        "Chunk",
        back_populates="document",
        cascade="all, delete"
    )


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    content = Column(Text, nullable=False)

    chunk_metadata = Column(JSON, nullable=True)

    # 🔥 NEW COLUMN FOR BM25
    tsv = Column(
        Text,
        nullable=True
    )

    document = relationship(
        "Document",
        back_populates="chunks"
    )
class EvaluationLog(Base):
    __tablename__ = "evaluation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    faithfulness_score = Column(Float, nullable=False)
    recall_score = Column(Float, nullable=False)
    rag_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())