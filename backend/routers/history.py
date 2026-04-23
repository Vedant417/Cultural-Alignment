from fastapi import APIRouter, HTTPException, Query
from backend.db.connection import get_db
from bson import ObjectId
from datetime import datetime  # ✅ ADDED
import re

router = APIRouter(prefix="/api", tags=["history"])


def _serialize(doc: dict) -> dict:
    """Convert ObjectId to string and all datetime fields to ISO string."""
    from datetime import datetime as dt
    
    doc["id"] = str(doc.pop("_id"))
    
    # Convert all datetime fields to ISO strings
    for key, value in doc.items():
        if isinstance(value, dt):
            doc[key] = value.isoformat()
    
    return doc


# =========================================================
# ✅ STATIC ROUTES FIRST (VERY IMPORTANT)
# =========================================================

@router.get("/history/grouped/all")
async def get_history_grouped():
    db = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(500)

    groups: dict[str, dict] = {}

    for doc in docs:
        try:
            movie = doc.get("movie", {})
            title = movie.get("title", "").strip()

            if not title:
                continue

            key = title.lower()

            result = doc.get("result", {})
            searched_at = doc.get("searched_at")

            searched_at_str = (
                searched_at.isoformat()
                if hasattr(searched_at, "isoformat")
                else str(searched_at)
            )

            if key not in groups:
                groups[key] = {
                    "title": title,
                    "poster_url": movie.get("poster_url", ""),
                    "language": movie.get("language", ""),
                    "release_date": movie.get("release_date", ""),
                    "latest_date": searched_at_str,
                    "entries": [],
                }

            groups[key]["entries"].append({
                "id": str(doc["_id"]),
                "target_region": doc.get("target_region", ""),
                "score": result.get("score"),
                "label": result.get("label", ""),
                "reason": result.get("reason", ""),
                "searched_at": searched_at_str,
            })

            if searched_at_str > groups[key]["latest_date"]:
                groups[key]["latest_date"] = searched_at_str

        except Exception:
            continue

    result_list = list(groups.values())
    result_list.sort(key=lambda x: x["latest_date"], reverse=True)

    return result_list


@router.get("/history/cached")
async def get_cached_analysis(
    title: str = Query(...),
    region: str = Query(...),
):
    db = get_db()

    doc = await db.alignments.find_one({
        "movie.title": {"$regex": f"^{re.escape(title)}$", "$options": "i"},
        "target_region": region,
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Cached analysis not found")

    return _serialize(doc)


@router.get("/history")
async def get_history():
    db = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(200)
    return [_serialize(d) for d in docs]


# =========================================================
# ⭐ FAVORITES ROUTES (ADD BEFORE DYNAMIC ROUTES)
# =========================================================

@router.post("/favorites/{doc_id}")
async def save_favorite(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "Invalid ID.")

    db = get_db()
    await db.alignments.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"favorited": True, "favorited_at": datetime.utcnow()}}
    )

    return {"favorited": True}


@router.delete("/favorites/{doc_id}")
async def remove_favorite(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "Invalid ID.")

    db = get_db()
    await db.alignments.update_one(
        {"_id": ObjectId(doc_id)},
        {"$unset": {"favorited": "", "favorited_at": ""}}
    )

    return {"favorited": False}


@router.get("/favorites")
async def get_favorites():
    db = get_db()
    docs = await db.alignments.find(
        {"favorited": True}
    ).sort("favorited_at", -1).to_list(200)

    return [_serialize(d) for d in docs]


# =========================================================
# ❌ DYNAMIC ROUTES LAST (CRITICAL)
# =========================================================

@router.get("/history/{doc_id}")
async def get_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    db = get_db()
    doc = await db.alignments.find_one({"_id": ObjectId(doc_id)})

    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return _serialize(doc)


@router.delete("/history/{doc_id}")
async def delete_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    db = get_db()
    result = await db.alignments.delete_one({"_id": ObjectId(doc_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {"deleted": True, "id": doc_id}