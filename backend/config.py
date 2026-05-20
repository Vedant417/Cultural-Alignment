from pydantic_settings import BaseSettings
from typing import Literal
import os


class Settings(BaseSettings):
    TMDB_API_KEY:    str = "a3d117500dc275ba72d9e9268a7c579d"
    OMDB_API_KEY:    str = "c1b9c6df"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MONGODB_URI:     str = "mongodb://localhost:27017"
    MONGODB_DB:      str = "culture_align"
    GROQ_API_KEY:    str  = ""
    GROQ_MODEL:      str  = "llama-3.3-70b-versatile"
    LLM_PROVIDER:    str  = "auto"
    ENVIRONMENT:     str  = "development"

    class Config:
        env_file = ".env"


settings = Settings()

if os.getenv("ENVIRONMENT") == "production":
    if not settings.MONGODB_URI:
        raise RuntimeError("MONGODB_URI not set")
    if not settings.TMDB_API_KEY or settings.TMDB_API_KEY == "a3d117500dc275ba72d9e9268a7c579d":
        raise RuntimeError("TMDB_API_KEY must be set")