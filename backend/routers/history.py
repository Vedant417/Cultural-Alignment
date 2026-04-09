from fastapi import APIRouter, HTTPException
from db.connection import get_db
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["history"])


def _serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId _id to string id for JSON serialization."""
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/history")
async def get_history():
    """Return all past analyses, sorted newest first. Capped at 100."""
    db   = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(100)
    return [_serialize(d) for d in docs]


@router.get("/history/{doc_id}")
async def get_one(doc_id: str):
    """Return a single analysis by its MongoDB ID."""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db  = get_db()
    doc = await db.alignments.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _serialize(doc)


@router.delete("/history/{doc_id}")
async def delete_one(doc_id: str):
    """Delete a single analysis by ID."""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db     = get_db()
    result = await db.alignments.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {"deleted": True, "id": doc_id}