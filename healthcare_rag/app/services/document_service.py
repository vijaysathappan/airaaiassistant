from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.db.models import Document, Chunk
from app.services.embedding_service import EmbeddingService
from app.retrieval.faiss_store import FAISSStore
from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.text_splitter import split_text
from app.utils.text_cleaner import clean_text


class DocumentService:

    # --------------------------------------------------
    # 🔥 GENERIC DOCUMENT CREATION
    # --------------------------------------------------
    @staticmethod
    async def create_document(
        db: AsyncSession,
        title: str,
        source: str,
        chunks: list[dict],
    ) -> Document:

        try:
            document = Document(title=title, source=source)
            db.add(document)
            await db.flush()

            chunk_objects = []

            for chunk_data in chunks:
                chunk = Chunk(
                    document_id=document.id,
                    content=chunk_data["content"],
                    chunk_metadata=chunk_data.get("metadata", {}),
                )
                db.add(chunk)
                chunk_objects.append(chunk)

            await db.flush()

            # 🔥 Generate embeddings
            embedding_service = EmbeddingService()
            texts = [chunk.content for chunk in chunk_objects]
            embeddings = await embedding_service.embed_texts(texts)

            chunk_ids = [chunk.id for chunk in chunk_objects]

            # 🔥 Add to FAISS
            faiss_store = FAISSStore()
            faiss_store.add_embeddings(embeddings, chunk_ids)

            await db.commit()
            await db.refresh(document)

            return document

        except SQLAlchemyError as e:
            await db.rollback()
            raise e


    # --------------------------------------------------
    # 🔥 PRODUCTION PDF INGESTION
    # --------------------------------------------------
    @staticmethod
    async def ingest_pdf(
        db: AsyncSession,
        file_path: str,
        title: str,
    ) -> Document:

        try:
            # 1️⃣ Extract raw text
            raw_text = extract_text_from_pdf(file_path)

            # 2️⃣ Clean text (VERY IMPORTANT)
            cleaned_text = clean_text(raw_text)

            # 3️⃣ Semantic chunking
            chunk_texts = split_text(cleaned_text)

            if not chunk_texts:
                raise ValueError("No text extracted from PDF.")

            # 4️⃣ Create document
            document = Document(title=title, source="PDF")
            db.add(document)
            await db.flush()

            chunk_objects = []

            for idx, chunk_text in enumerate(chunk_texts):
                chunk = Chunk(
                    document_id=document.id,
                    content=chunk_text,
                    chunk_metadata={
                        "chunk_index": idx,
                        "source": "pdf",
                        "length": len(chunk_text)
                    },
                )
                db.add(chunk)
                chunk_objects.append(chunk)

            await db.flush()

            # 5️⃣ Generate embeddings
            embedding_service = EmbeddingService()
            texts = [chunk.content for chunk in chunk_objects]
            embeddings = await embedding_service.embed_texts(texts)

            chunk_ids = [chunk.id for chunk in chunk_objects]

            # 6️⃣ Add to FAISS
            faiss_store = FAISSStore()
            faiss_store.add_embeddings(embeddings, chunk_ids)

            await db.commit()
            await db.refresh(document)

            return document

        except Exception as e:
            await db.rollback()
            raise e