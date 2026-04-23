from pydantic_settings import BaseSettings
from typing import Literal
import os


class Settings(BaseSettings):
    # Existing settings
    TMDB_API_KEY:    str = "a3d117500dc275ba72d9e9268a7c579d"
    OMDB_API_KEY:    str = "c1b9c6df"                     # Optional: OMDb fallback
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MONGODB_URI:     str = "mongodb://localhost:27017"
    MONGODB_DB:      str = "culture_align"

    # NEW: Groq settings
    GROQ_API_KEY:    str  = ""                           # blank = Groq disabled
    GROQ_MODEL:      str  = "llama-3.3-70b-versatile"    # updated from decommissioned llama3-70b-8192
    LLM_PROVIDER:    str  = "auto"                       # "auto" | "ollama" | "groq"

    class Config:
        env_file = ".env"


settings = Settings()

# Validate critical settings in production
if os.getenv("ENVIRONMENT") == "production":
    if not settings.MONGODB_URI or settings.MONGODB_URI == "mongodb://localhost:27017":
        raise RuntimeError(
            "❌ PRODUCTION ERROR: MONGODB_URI must be set to a remote database. "
            "Set MONGODB_URI environment variable in Railway."
        )
    if not settings.TMDB_API_KEY or settings.TMDB_API_KEY == "a3d117500dc275ba72d9e9268a7c579d":
        raise RuntimeError(
            "❌ PRODUCTION ERROR: TMDB_API_KEY must be set. "
            "Set TMDB_API_KEY environment variable in Railway."
        )