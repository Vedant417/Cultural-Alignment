from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import OperationFailure
from backend.config import settings

_client: AsyncIOMotorClient | None = None
_db:     AsyncIOMotorDatabase | None = None


def _validate_mongo_uri(uri: str) -> None:
    if "<db_password>" in uri or "your_password" in uri or "<password>" in uri:
        raise RuntimeError(
            "MONGODB_URI contains a placeholder password. "
            "Update backend/.env with your MongoDB password or use a local MongoDB URI."
        )


async def connect_db():
    """Called on FastAPI startup. Creates the Motor client and selects the DB."""
    global _client, _db
    _validate_mongo_uri(settings.MONGODB_URI)
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db     = _client[settings.MONGODB_DB]

    try:
        await _client.admin.command("ping")
    except OperationFailure as exc:
        raise RuntimeError(
            "MongoDB authentication failed. Check backend/.env and verify your Atlas credentials or local MongoDB URI."
        ) from exc

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