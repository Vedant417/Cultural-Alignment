from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

_client: AsyncIOMotorClient | None = None
_db:     AsyncIOMotorDatabase | None = None


async def connect_db():
    """Called on FastAPI startup. Creates the Motor client and selects the DB."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db     = _client[settings.MONGODB_DB]
    # Ping to confirm connection
    await _client.admin.command("ping")
    print(f"✅ MongoDB connected: {settings.MONGODB_DB}")


async def close_db():
    """Called on FastAPI shutdown."""
    global _client
    if _client:
        _client.close()
        print("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Dependency — returns the active DB instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Was connect_db() called?")
    return _db