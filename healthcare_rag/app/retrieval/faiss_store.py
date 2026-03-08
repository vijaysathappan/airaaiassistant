import faiss
import numpy as np
import os
from pathlib import Path
import uuid


class FAISSStore:
    def __init__(self, dim: int = 768, index_path: str = "faiss_index"):
        self.dim = dim
        self.index_path = Path(index_path)
        self.index_file = self.index_path / "index.faiss"
        self.id_map_file = self.index_path / "id_map.npy"

        self.index = None
        self.id_map = []

        self._initialize()

    def _initialize(self):
        os.makedirs(self.index_path, exist_ok=True)

        if self.index_file.exists() and self.id_map_file.exists():
            self.index = faiss.read_index(str(self.index_file))
            self.id_map = list(np.load(self.id_map_file, allow_pickle=True))
        else:
            self.index = faiss.IndexFlatL2(self.dim)
            self.id_map = []

    def add_embeddings(self, embeddings: list[list[float]], chunk_ids: list):
        vectors = np.array(embeddings).astype("float32")

        if vectors.shape[1] != self.dim:
            raise ValueError("Embedding dimension mismatch")

        self.index.add(vectors)

        # store UUIDs as string for safety
        self.id_map.extend([str(cid) for cid in chunk_ids])

        self._save()

    def search(self, query_vector: list[float], top_k: int = 5):

        # 🔥 safety: empty index
        if self.index.ntotal == 0:
            return []

        vector = np.array([query_vector]).astype("float32")

        distances, indices = self.index.search(vector, top_k)

        results = []

        for idx in indices[0]:
            # FAISS returns -1 for empty slots
            if 0 <= idx < len(self.id_map):
                results.append(self.id_map[idx])

        return results

    def _save(self):
        faiss.write_index(self.index, str(self.index_file))
        np.save(self.id_map_file, np.array(self.id_map, dtype=object))