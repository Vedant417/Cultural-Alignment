from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from db.connection import get_db
from db.models import (
    AnalyzeRequest, MultiAnalyzeRequest,
    AlignmentDocument, AnalyzeResponse,
    MovieInfo, RegionInfo, AnalysisResult,
    ContentFlags, SimilarMovie,
    RegionScore, MultiAnalyzeResponse,
)
from modules.tmdb   import fetch_movie
from modules.region import detect_region
from modules.scorer import get_cultural_score

router = APIRouter(prefix="/api", tags=["analyze"])


# ─────────────────────────────────────────────────────────────────
# HELPER: check MongoDB cache for (movie_title, target_region)
# ─────────────────────────────────────────────────────────────────
async def _get_cached(title: str, target_region: str) -> dict | None:
    """
    Look up MongoDB for an existing analysis of (movie title, target_region).
    Title match is case-insensitive.
    Returns the raw MongoDB document or None.
    """
    db  = get_db()
    doc = await db.alignments.find_one({
        "movie.title":  {"$regex": f"^{title}$", "$options": "i"},
        "target_region": target_region,
    })
    return doc


# ─────────────────────────────────────────────────────────────────
# HELPER: build a clean AlignmentDocument from score_data + other info
# ─────────────────────────────────────────────────────────────────
def _build_doc(movie_data: dict, origin: dict, target_region: str, score_data: dict) -> AlignmentDocument:
    flags_raw   = score_data.get("content_flags", {})
    similar_raw = score_data.get("similar_movies", [])

    safe_flags = {
        "violence":             flags_raw.get("violence",             "None"),
        "adult_content":        flags_raw.get("adult_content",        "None"),
        "religion_sensitivity": flags_raw.get("religion_sensitivity", "None"),
        "drug_glorification":   flags_raw.get("drug_glorification",   "None"),
    }

    return AlignmentDocument(
        searched_at=datetime.utcnow(),
        movie=MovieInfo(**movie_data),
        origin_region=RegionInfo(
            region=origin.get("region", "Unknown"),
            state=origin.get("state",  ""),
            lat=float(origin.get("lat", 0.0)),
            lon=float(origin.get("lon", 0.0)),
        ),
        target_region=target_region,
        result=AnalysisResult(
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            reason=score_data.get("reason", ""),
            content_flags=ContentFlags(**safe_flags),
            audience_note=score_data.get("audience_note", ""),
            similar_movies=[
                SimilarMovie(**sm) for sm in similar_raw[:3]
                if isinstance(sm, dict) and "title" in sm and "reason" in sm
            ],
        )
    )


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze — single movie + single target region
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Pipeline:
      1. Fetch movie from TMDB
      2. Check MongoDB cache (movie + target_region) → return instantly if found
      3. Detect origin/production region via Ollama
      4. Score cultural fit for target_region via Ollama
      5. Save to MongoDB
      6. Return result
    """

    # Step 1: TMDB
    movie_data = await fetch_movie(request.movie_name)
    if not movie_data:
        raise HTTPException(
            status_code=404,
            detail=f"Movie '{request.movie_name}' not found on TMDB."
        )

    # Step 2: Cache check — avoids calling Ollama if already analyzed
    cached_doc = await _get_cached(movie_data["title"], request.target_region)
    if cached_doc:
        cached_doc["id"] = str(cached_doc.pop("_id"))
        # Convert datetime to string for response
        if isinstance(cached_doc.get("searched_at"), datetime):
            cached_doc["searched_at"] = cached_doc["searched_at"].isoformat()
        return {**cached_doc, "cached": True}

    # Step 3: Detect production country
    origin = await detect_region(movie_data)

    # Step 4: Score for target region
    score_data = await get_cultural_score(
        movie_data,
        target_region=request.target_region,
        state=""
    )
    if not score_data:
        raise HTTPException(
            status_code=500,
            detail="Cultural scoring failed or timed out. Is Ollama running? Try `ollama serve`."
        )

    # Step 5: Save to MongoDB
    doc    = _build_doc(movie_data, origin, request.target_region, score_data)
    db     = get_db()
    result = await db.alignments.insert_one(doc.model_dump())
    doc_id = str(result.inserted_id)

    # Step 6: Return
    return {
        "id":            doc_id,
        "searched_at":   doc.searched_at.isoformat(),
        "movie":         doc.movie.model_dump(),
        "origin_region": doc.origin_region.model_dump(),
        "target_region": doc.target_region,
        "result":        doc.result.model_dump(),
        "cached":        False,
    }


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze/multi — one movie vs many countries (pie chart)
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze/multi", response_model=MultiAnalyzeResponse)
async def analyze_multi(request: MultiAnalyzeRequest):
    """
    Score a movie against multiple countries in one request.
    Each country is cache-checked individually — only calls Ollama
    for countries not yet in MongoDB.

    Used by the frontend pie chart.
    """

    # Step 1: TMDB
    movie_data = await fetch_movie(request.movie_name)
    if not movie_data:
        raise HTTPException(
            status_code=404,
            detail=f"Movie '{request.movie_name}' not found on TMDB."
        )

    # Deduplicate requested regions
    regions = list(dict.fromkeys(request.regions))  # preserve order, remove duplicates
    origin  = None
    scores  = []

    for region in regions:

        # Cache check first
        cached_doc = await _get_cached(movie_data["title"], region)
        if cached_doc:
            r = cached_doc.get("result", {})
            scores.append(RegionScore(
                region=region,
                score=r.get("score"),
                label=r.get("label", ""),
                cached=True,
            ))
            continue

        # Detect origin only once (shared across all regions)
        if origin is None:
            origin = await detect_region(movie_data)

        # Score for this region
        score_data = await get_cultural_score(movie_data, target_region=region)
        if not score_data:
            scores.append(RegionScore(region=region, score=None, label="Failed", cached=False))
            continue

        # Save to MongoDB
        doc    = _build_doc(movie_data, origin, region, score_data)
        db     = get_db()
        await db.alignments.insert_one(doc.model_dump())

        scores.append(RegionScore(
            region=region,
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            cached=False,
        ))

    return MultiAnalyzeResponse(
        movie=MovieInfo(**movie_data),
        scores=scores,
    )