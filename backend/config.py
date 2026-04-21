from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Existing settings
    TMDB_API_KEY:    str = "a3d117500dc275ba72d9e9268a7c579d"
    OMDB_API_KEY:    str = "c1b9c6df"                     # Optional: OMDb fallback
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MONGODB_URI:     str = "mongodb://localhost:27017"
    MONGODB_DB:      str = "culture_align"

    # NEW: Groq settings
    GROQ_API_KEY:    str  = ""                    # blank = Groq disabled
    GROQ_MODEL:      str  = "llama3-70b-8192"     # default Groq model
    LLM_PROVIDER:    str  = "auto"                # "auto" | "ollama" | "groq"

    class Config:
        env_file = ".env"


settings = Settings()