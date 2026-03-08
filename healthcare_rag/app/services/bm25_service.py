from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class BM25Service:

    @staticmethod
    async def search(db: AsyncSession, query: str, top_k: int = 5):

        sql = text("""
            SELECT id, content, chunk_metadata, 1.0 AS rank
            FROM chunks
            WHERE content LIKE :query
            LIMIT :limit
        """)

        result = await db.execute(sql, {"query": f"%{query}%", "limit": top_k})
        rows = result.fetchall()

        return [
            {
                "chunk_id": row.id,
                "content": row.content,
                "metadata": row.chunk_metadata,
                "score": float(row.rank),
            }
            for row in rows
        ]