import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import OperationFailure

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
    
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI environment variable is not set")
    
    mongodb_db = os.getenv("MONGODB_DB", "culture_align")
    _validate_mongo_uri(mongodb_uri)
    
    try:
        _client = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        _db     = _client[mongodb_db]
        await _client.admin.command("ping")
        print(f"✅ MongoDB connected: {mongodb_db}")
    except OperationFailure as exc:
        raise RuntimeError("MongoDB authentication failed") from exc
    except Exception as exc:
        raise RuntimeError(f"Failed to connect to MongoDB: {str(exc)}") from exc


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