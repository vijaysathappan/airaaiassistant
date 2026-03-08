import json
from app.core.config import get_settings

class CacheService:
    _cache = {}

    def __init__(self):
        self.settings = get_settings()

    async def get(self, query: str):
        # 🔥 Simple exact match in-memory cache fallback
        if query in CacheService._cache:
            return CacheService._cache[query]
        return None

    async def set(self, query: str, value: dict, ttl: int = 3600):
        CacheService._cache[query] = value