from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from db.connection import get_db
from db.models import (
    AnalyzeRequest, AlignmentDocument,
    MovieInfo, RegionInfo, AnalysisResult,
    ContentFlags, SimilarMovie
)
from modules.tmdb   import fetch_movie
from modules.region import detect_region
from modules.scorer import get_cultural_score

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Full pipeline:
      1. Fetch movie metadata from TMDB
      2. Detect production region via Ollama
      3. Score cultural fit via Ollama
      4. Build AlignmentDocument
      5. Save to MongoDB `alignments` collection
      6. Return the full result + MongoDB ID
    """

    # ── Step 1: TMDB ──────────────────────────────────────────
    movie_data = await fetch_movie(request.movie_name)
    if not movie_data:
        raise HTTPException(
            status_code=404,
            detail=f"Movie '{request.movie_name}' not found on TMDB. Try a different spelling."
        )

    # ── Step 2: Region detection ───────────────────────────────
    region_data = await detect_region(movie_data)

    # ── Step 3: Cultural scoring ───────────────────────────────
    score_data = await get_cultural_score(
        movie_data,
        region_data.get("region", ""),
        region_data.get("state", "")
    )
    if not score_data:
        raise HTTPException(
            status_code=500,
            detail="Cultural analysis failed or timed out. Is Ollama running? Try `ollama serve`."
        )

    # ── Step 4: Build document ─────────────────────────────────
    flags_raw  = score_data.get("content_flags", {})
    similar_raw = score_data.get("similar_movies", [])

    # Safely build ContentFlags — ignore unknown keys from LLM output
    safe_flag_keys = {"violence", "adult_content", "religion_sensitivity", "drug_glorification"}
    flags_clean = {k: v for k, v in flags_raw.items() if k in safe_flag_keys}

    doc = AlignmentDocument(
        searched_at=datetime.utcnow(),
        movie=MovieInfo(**movie_data),
        region=RegionInfo(
            region=region_data.get("region", "Unknown"),
            state=region_data.get("state", ""),
            lat=region_data.get("lat", 0.0),
            lon=region_data.get("lon", 0.0),
        ),
        result=AnalysisResult(
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            reason=score_data.get("reason", ""),
            content_flags=ContentFlags(**flags_clean) if flags_clean else ContentFlags(),
            audience_note=score_data.get("audience_note", ""),
            similar_movies=[
                SimilarMovie(**sm) for sm in similar_raw[:3]
                if isinstance(sm, dict) and "title" in sm and "reason" in sm
            ],
        )
    )

    # ── Step 5: Save to MongoDB ────────────────────────────────
    db     = get_db()
    result = await db.alignments.insert_one(doc.model_dump())
    doc_id = str(result.inserted_id)

    # ── Step 6: Return ─────────────────────────────────────────
    return {"id": doc_id, **doc.model_dump()}