from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(".env")


from typing import Optional

class Settings(BaseSettings):
    POSTGRES_URL: str
    REDIS_URL: Optional[str] = None
    ENVIRONMENT: str = "development"
    GOOGLE_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    return Settings()
