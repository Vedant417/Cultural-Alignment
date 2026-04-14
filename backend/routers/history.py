from fastapi import APIRouter, HTTPException
from db.connection import get_db
from bson import ObjectId
from collections import defaultdict

router = APIRouter(prefix="/api", tags=["history"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    # Convert datetime to string if needed
    if hasattr(doc.get("searched_at"), "isoformat"):
        doc["searched_at"] = doc["searched_at"].isoformat()
    return doc


# ── Existing: flat list ───────────────────────────────────────────
@router.get("/history")
async def get_history():
    """All analyses, newest first, cap 200."""
    db   = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(200)
    return [_serialize(d) for d in docs]


# ── Existing: single by ID ────────────────────────────────────────
@router.get("/history/{doc_id}")
async def get_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db  = get_db()
    doc = await db.alignments.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _serialize(doc)


# ── Existing: delete ─────────────────────────────────────────────
@router.delete("/history/{doc_id}")
async def delete_one(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    db     = get_db()
    result = await db.alignments.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {"deleted": True, "id": doc_id}


# ── NEW: grouped by movie title ───────────────────────────────────
@router.get("/history/grouped/all")
async def get_history_grouped():
    """
    Return history grouped by movie title.
    Each group has: title, poster_url, latest_date, and a list of
    country entries (id, target_region, score, label, reason, searched_at).

    Used by the new History page to show one row per movie with
    expandable country breakdown instead of one row per analysis.
    """
    db   = get_db()
    docs = await db.alignments.find().sort("searched_at", -1).to_list(500)

    # Group by movie title (case-insensitive key)
    groups: dict[str, dict] = {}

    for doc in docs:
        title  = doc.get("movie", {}).get("title", "Unknown")
        key    = title.lower().strip()

        if key not in groups:
            groups[key] = {
                "title":         title,
                "poster_url":    doc.get("movie", {}).get("poster_url", ""),
                "language":      doc.get("movie", {}).get("language", ""),
                "release_date":  doc.get("movie", {}).get("release_date", ""),
                "latest_date":   doc.get("searched_at"),
                "entries":       [],
            }

        result      = doc.get("result", {})
        searched_at = doc.get("searched_at")

        groups[key]["entries"].append({
            "id":            str(doc["_id"]),
            "target_region": doc.get("target_region", ""),
            "score":         result.get("score"),
            "label":         result.get("label", ""),
            "reason":        result.get("reason", ""),
            "searched_at":   searched_at.isoformat() if hasattr(searched_at, "isoformat") else str(searched_at),
        })

        # Keep latest_date as the most recent across all entries
        if searched_at and searched_at > (groups[key]["latest_date"] or searched_at):
            groups[key]["latest_date"] = searched_at

    # Convert to list, sorted by latest_date desc
    result_list = list(groups.values())
    result_list.sort(
        key=lambda g: g["latest_date"] or "",
        reverse=True
    )

    # Convert datetime objects to strings
    for g in result_list:
        if hasattr(g.get("latest_date"), "isoformat"):
            g["latest_date"] = g["latest_date"].isoformat()

    return result_list


# ── NEW: fetch cached analysis by movie title + region ────────────
@router.get("/history/cached")
async def get_cached_analysis(title: str, region: str):
    """
    Fetch a cached analysis by movie title + target region.
    Used when redirecting from history page to analyze page.
    Returns the full analysis document.
    """
    db  = get_db()
    doc = await db.alignments.find_one({
        "movie.title":   {"$regex": f"^{title}$", "$options": "i"},
        "target_region": region,
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Cached analysis not found.")
    return _serialize(doc)