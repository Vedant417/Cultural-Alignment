from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    TMDB_API_KEY: str = "a3d117500dc275ba72d9e9268a7c579d"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "culture_align"

    class Config:
        env_file = ".env"

settings = Settings()