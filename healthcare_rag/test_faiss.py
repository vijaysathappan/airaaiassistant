from app.retrieval.faiss_store import FAISSStore
import numpy as np

store = FAISSStore(dim=4)

embeddings = [
    [0.1, 0.2, 0.3, 0.4],
    [0.9, 0.8, 0.7, 0.6],
]

chunk_ids = [101, 102]

store.add_embeddings(embeddings, chunk_ids)

result = store.search([0.1, 0.2, 0.3, 0.4], top_k=1)

print("Search result:", result)