import re
from fastapi import APIRouter, HTTPException, Query
from db.connection import get_db
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["history"])


def _serialize(doc: dict) -> dict:
    """Convert ObjectId to string and datetime to ISO string."""
    doc["id"] = str(doc.pop("_id"))
    if hasattr(doc.get("searched_at"), "isoformat"):
        doc["searched_at"] = doc["searched_at"].isoformat()
    return doc


# ════════════════════════════════════════════════════════════════
# STATIC ROUTES FIRST — must be before /{doc_id}
# ════════════════════════════════════════════════════════════════

@router.get("/history/grouped/all")
async def get_history_grouped():
    """
    Return all analyses grouped by movie title.
    One object per unique movie, each containing all country entries.

    Route declared FIRST to prevent /{doc_id} from swallowing it.
    """
    db   = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(500)

    groups: dict[str, dict] = {}

    for doc in docs:
        try:
            movie      = doc.get("movie", {})
            title      = movie.get("title", "").strip()
            if not title:
                continue

            key = title.lower()

            result     = doc.get("result", {})
            searched_at = doc.get("searched_at")
            searched_at_str = (
                searched_at.isoformat()
                if hasattr(searched_at, "isoformat")
                else str(searched_at)
            )

            if key not in groups:
                groups[key] = {
                    "title":        title,
                    "poster_url":   movie.get("poster_url", ""),
                    "language":     movie.get("language", ""),
                    "release_date": movie.get("release_date", ""),
                    "latest_date":  searched_at_str,
                    "entries":      [],
                }

            groups[key]["entries"].append({
                "id":            str(doc["_id"]),
                "target_region": doc.get("target_region", ""),
                "score":         result.get("score"),
                "label":         result.get("label", ""),
                "reason":        result.get("reason", ""),
                "searched_at":   searched_at_str,
            })

            # Update latest_date if this doc is newer
            if searched_at_str > groups[key]["latest_date"]:
                groups[key]["latest_date"] = searched_at_str

        except Exception:
            # Skip malformed documents — don't crash the whole response
            continue

    result_list = list(groups.values())
    result_list.sort(key=lambda g: g["latest_date"], reverse=True)

    return result_list


@router.get("/history/cached")
async def get_cached_analysis(
    title:  str = Query(...),
    region: str = Query(...),
):
    """
    Fetch a specific cached analysis by movie title + target region.
    Used by the Analyze page when redirected from History.

    Route declared BEFORE /{doc_id} to avoid route conflict.
    """
    db  = get_db()
    doc = await db.alignments.find_one({
        "movie.title":   {"$regex": f"^{re.escape(title)}$", "$options": "i"},
        "target_region": region,
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Cached analysis not found.")
    return _serialize(doc)


# ════════════════════════════════════════════════════════════════
# FLAT LIST — existing endpoint unchanged
# ════════════════════════════════════════════════════════════════

@router.get("/history")
async def get_history():
    """All analyses flat, newest first, cap 200."""
    db   = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(200)
    return [_serialize(d) for d in docs]


# ════════════════════════════════════════════════════════════════
# DYNAMIC ROUTES LAST — /{doc_id} catches everything else
# ════════════════════════════════════════════════════════════════

@router.get("/history/{doc_id}")
async def get_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db  = get_db()
    doc = await db.alignments.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _serialize(doc)


@router.delete("/history/{doc_id}")
async def delete_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db     = get_db()
    result = await db.alignments.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {"deleted": True, "id": doc_id}
