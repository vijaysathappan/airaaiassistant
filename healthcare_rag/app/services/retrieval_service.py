from app.services.embedding_service import EmbeddingService
from app.retrieval.faiss_store import FAISSStore
from app.services.bm25_service import BM25Service
from app.services.query_rewrite_service import QueryRewriteService
from sqlalchemy import select
from app.db.models import Chunk


class RetrievalService:

    @staticmethod
    async def search(db, query: str, top_k: int = 5):

        # 🔥 1️⃣ Rewrite Query
        queries = await QueryRewriteService.rewrite(query)

        fused_scores = {}
        k = 60

        for q in queries:

            # 2️⃣ Vector search
            embedding_service = EmbeddingService()
            query_vector = await embedding_service.embed_texts([q])
            query_vector = query_vector[0]

            faiss_store = FAISSStore()
            vector_ids = faiss_store.search(query_vector, top_k=top_k)

            # 3️⃣ BM25 search
            bm25_results = await BM25Service.search(db, q, top_k)
            bm25_ids = [str(r["chunk_id"]) for r in bm25_results]

            # 4️⃣ RRF Fusion
            for rank, cid in enumerate(vector_ids):
                fused_scores[cid] = fused_scores.get(cid, 0) + 1 / (k + rank + 1)

            for rank, cid in enumerate(bm25_ids):
                fused_scores[cid] = fused_scores.get(cid, 0) + 1 / (k + rank + 1)

        # Sort final fused results
        sorted_ids = sorted(
            fused_scores,
            key=lambda x: fused_scores[x],
            reverse=True
        )[:top_k]

        if not sorted_ids:
            return []

        stmt = select(Chunk).where(Chunk.id.in_(sorted_ids))
        result = await db.execute(stmt)
        matched_chunks = result.scalars().all()

        if not matched_chunks:
            return []

        # 🔥 Parent-Document Retrieval (Gemini long context optimization)
        document_ids = list({chunk.document_id for chunk in matched_chunks if chunk.document_id})

        if not document_ids:
            return []

        from sqlalchemy.orm import selectinload
        from app.db.models import Document

        doc_stmt = select(Document).where(Document.id.in_(document_ids)).options(selectinload(Document.chunks))
        doc_result = await db.execute(doc_stmt)
        documents = doc_result.scalars().all()

        return [
            {
                "document_id": str(doc.id),
                "title": doc.title,
                "content": f"Source: {doc.title}\n\n" + "\n".join([c.content for c in doc.chunks]),
                "metadata": {"type": "parent_document", "source": doc.source}
            }
            for doc in documents
        ]