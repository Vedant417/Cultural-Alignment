from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.connection import get_db
from db.models import MovieInfo, RegionInfo, AnalysisResult, AlignmentDocument, ContentFlags, SimilarMovie
from modules.tmdb import fetch_movie
from modules.hybrid_fetcher import hybrid_fetch_movie
from modules.region import detect_region
from modules.scorer import get_cultural_score
from datetime import datetime
import asyncio

router = APIRouter(prefix="/api/compare", tags=["compare"])


# ── Request model ─────────────────────────────────────────────────
class TwoMovieRequest(BaseModel):
    movie_input_a: str
    movie_input_b: str
    target_region: str


# ── Response helpers ──────────────────────────────────────────────
def _build_compare_entry(movie_data: dict, origin: dict, score_data: dict, winner: bool) -> dict:
    flags_raw = score_data.get("content_flags", {})
    similar_raw = score_data.get("similar_movies", [])
    return {
        "movie": MovieInfo(**movie_data).model_dump(),
        "origin_region": RegionInfo(
            region=origin.get("region", "Unknown"),
            state=origin.get("state", ""),
            lat=float(origin.get("lat", 0.0)),
            lon=float(origin.get("lon", 0.0)),
        ).model_dump(),
        "score":         score_data.get("score"),
        "label":         score_data.get("label", ""),
        "reason":        score_data.get("reason", ""),
        "audience_note": score_data.get("audience_note", ""),
        "content_flags": {
            "violence":             flags_raw.get("violence", "None"),
            "adult_content":        flags_raw.get("adult_content", "None"),
            "religion_sensitivity": flags_raw.get("religion_sensitivity", "None"),
            "drug_glorification":   flags_raw.get("drug_glorification", "None"),
        },
        "winner": winner,
    }


async def _save_to_db(movie_data: dict, origin: dict, region: str, score_data: dict):
    """Save analysis to MongoDB (non-blocking — errors silently ignored)."""
    try:
        db = get_db()
        flags_raw = score_data.get("content_flags", {})
        doc = AlignmentDocument(
            searched_at=datetime.utcnow(),
            movie=MovieInfo(**movie_data),
            origin_region=RegionInfo(
                region=origin.get("region", "Unknown"),
                state=origin.get("state", ""),
                lat=float(origin.get("lat", 0.0)),
                lon=float(origin.get("lon", 0.0)),
            ),
            target_region=region,
            result=AnalysisResult(
                score=score_data.get("score"),
                label=score_data.get("label", ""),
                reason=score_data.get("reason", ""),
                content_flags=ContentFlags(
                    violence=flags_raw.get("violence", "None"),
                    adult_content=flags_raw.get("adult_content", "None"),
                    religion_sensitivity=flags_raw.get("religion_sensitivity", "None"),
                    drug_glorification=flags_raw.get("drug_glorification", "None"),
                ),
                audience_note=score_data.get("audience_note", ""),
                similar_movies=[
                    SimilarMovie(**sm) for sm in score_data.get("similar_movies", [])[:3]
                    if isinstance(sm, dict) and "title" in sm and "reason" in sm
                ],
            ),
        )
        await db.alignments.insert_one(doc.model_dump())
    except Exception:
        pass


# ── POST /api/compare/two-movies ──────────────────────────────────
@router.post("/two-movies")
async def compare_two_movies(req: TwoMovieRequest):
    """
    Score TWO movies against ONE country.
    Fetches both movies in parallel, scores them in parallel.
    Returns side-by-side result with winner flag.
    """
    # ── Validate inputs ──
    if not req.movie_input_a.strip():
        raise HTTPException(status_code=400, detail="Movie A is required.")
    if not req.movie_input_b.strip():
        raise HTTPException(status_code=400, detail="Movie B is required.")
    if not req.target_region.strip():
        raise HTTPException(status_code=400, detail="Target region is required.")

    # ── Fetch both movies in parallel (hybrid) ──
    movie_a, movie_b = await asyncio.gather(
        hybrid_fetch_movie(req.movie_input_a.strip()),
        hybrid_fetch_movie(req.movie_input_b.strip()),
    )

    if not movie_a:
        raise HTTPException(
            status_code=404,
            detail=f"Movie A not found: '{req.movie_input_a}'. Check the title or link."
        )
    if not movie_b:
        raise HTTPException(
            status_code=404,
            detail=f"Movie B not found: '{req.movie_input_b}'. Check the title or link."
        )

    # ── Detect origins + score both in parallel (with error handling) ──
    try:
        origin_a, origin_b, score_a, score_b = await asyncio.gather(
            detect_region(movie_a),
            detect_region(movie_b),
            get_cultural_score(movie_a, target_region=req.target_region),
            get_cultural_score(movie_b, target_region=req.target_region),
            return_exceptions=True,
        )

        # Check for exceptions in results
        if isinstance(origin_a, Exception):
            raise origin_a
        if isinstance(origin_b, Exception):
            raise origin_b
        if isinstance(score_a, Exception):
            raise score_a
        if isinstance(score_b, Exception):
            raise score_b

    except asyncio.CancelledError:
        raise HTTPException(
            status_code=500,
            detail="Request timeout during scoring. LLM is taking too long. Try again in a moment."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scoring error: {str(e)}. Is Ollama/Groq running and reachable?"
        )

    if not score_a:
        raise HTTPException(status_code=500, detail=f"Scoring failed for '{movie_a['title']}'. Is Ollama/Groq running?")
    if not score_b:
        raise HTTPException(status_code=500, detail=f"Scoring failed for '{movie_b['title']}'. Is Ollama/Groq running?")

    # ── Determine winner ──
    score_a_val = score_a.get("score") or 0
    score_b_val = score_b.get("score") or 0
    a_wins = score_a_val >= score_b_val

    # ── Save both to MongoDB (non-blocking) ──
    asyncio.create_task(_save_to_db(movie_a, origin_a, req.target_region, score_a))
    asyncio.create_task(_save_to_db(movie_b, origin_b, req.target_region, score_b))

    return {
        "target_region": req.target_region,
        "movie_a": _build_compare_entry(movie_a, origin_a, score_a, winner=a_wins),
        "movie_b": _build_compare_entry(movie_b, origin_b, score_b, winner=not a_wins),
    }