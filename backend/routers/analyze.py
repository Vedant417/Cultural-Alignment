from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import json

from backend.db.connection import get_db
from backend.db.models import (
    AnalyzeRequest, CompareRequest, CompareResponse,
    AlignmentDocument, ComparisonEntry,
    MovieInfo, RegionInfo, AnalysisResult,
    ContentFlags, SimilarMovie,
)

from backend.modules.tmdb import fetch_movie, fetch_recommendations, fetch_genres
from backend.modules.hybrid_fetcher import hybrid_fetch_movie
from backend.modules.region import detect_region
from backend.modules.scorer import get_cultural_score, get_multi_cultural_scores
from backend.modules.llm import call_llm, safe_parse_json

router = APIRouter(prefix="/api", tags=["analyze"])


# ================================
# CACHE
# ================================
async def _get_cached(title: str, target_region: str):
    db = get_db()
    return await db.alignments.find_one({
        "movie.title": {"$regex": f"^{title}$", "$options": "i"},
        "target_region": target_region,
    })


# ================================
# BUILD DOC
# ================================
def _build_doc(movie_data, origin, target_region, score_data, recommendations=None, genres=None):
    flags_raw = score_data.get("content_flags", {})
    sub = score_data.get("sub_scores") or {}

    return AlignmentDocument(
        searched_at=datetime.utcnow(),
        movie=MovieInfo(**movie_data),
        origin_region=RegionInfo(
            region=origin.get("region", "Unknown"),
            state=origin.get("state", ""),
            lat=float(origin.get("lat", 0)),
            lon=float(origin.get("lon", 0)),
        ),
        target_region=target_region,
        result=AnalysisResult(
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            reason=score_data.get("reason", ""),
            sub_scores=sub,
            content_flags=ContentFlags(**flags_raw),
            audience_note=score_data.get("audience_note", ""),
            similar_movies=[],
            recommendations=recommendations or [],
            genres=genres or [],
        )
    )


# ================================
# ANALYZE
# ================================
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):

    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(404, "Movie not found")

    cached = await _get_cached(movie_data["title"], request.target_region)
    if cached:
        cached["id"] = str(cached["_id"])
        return {**cached, "cached": True}

    origin = await detect_region(movie_data)

    score_data = await get_cultural_score(movie_data, request.target_region)
    if not score_data:
        raise HTTPException(500, "Scoring failed")

    tmdb_id = movie_data.get("tmdb_id")
    recs = await fetch_recommendations(str(tmdb_id)) if tmdb_id else []
    genres = await fetch_genres(str(tmdb_id)) if tmdb_id else []

    doc = _build_doc(movie_data, origin, request.target_region, score_data, recs, genres)

    db = get_db()
    result = await db.alignments.insert_one(doc.model_dump())

    return {
        "id": str(result.inserted_id),
        "movie": doc.movie.model_dump(),
        "result": doc.result.model_dump(),
        "cached": False,
    }


# ================================
# RECOMMEND (FIXED)
# ================================
class RecommendRequest(BaseModel):
    title: str
    region: str
    score: int
    genre: str = ""


@router.post("/analyze/recommend")
async def recommend(body: RecommendRequest):
    """Recommend movies similar to the given title for a target region."""
    prompt = f"""
Recommend 3 movies similar to "{body.title}" for {body.region}.

Consider cultural themes, audience preferences, and content that resonates with {body.region}.

Reply with ONLY raw JSON (no markdown):
{{"recommendations":[{{"title":"Movie Title","reason":"Why it fits for {body.region}"}}]}}
"""

    raw = await call_llm(prompt)
    data = safe_parse_json(raw)

    return {"recommendations": data.get("recommendations", [])}


# ================================
# EXPLAIN (FIXED)
# ================================
class ExplainRequest(BaseModel):
    title: str
    region: str
    summary: str


@router.post("/analyze/explain")
async def explain(body: ExplainRequest):
    """Explain the cultural fit of a movie in a target region."""
    prompt = f"""
Explain the cultural fit of "{body.title}" for audiences in {body.region}.

Context: {body.summary}

Consider:
- Language and accessibility
- Cultural themes and values alignment
- Content sensitivity (violence, adult themes, religion, drugs)
- Audience demographics in {body.region}

Reply with ONLY raw JSON (no markdown):
{{"cultural_fit":"explanation","language_accessibility":"assessment","themes":"relevant themes","content_notes":"any content warnings for {body.region}"}}
"""

    raw = await call_llm(prompt)
    return safe_parse_json(raw)


# ================================
# DEEP ANALYSIS (FIXED)
# ================================
class DeepAnalysisRequest(BaseModel):
    movie_title: str
    target_region: str
    score: int
    label: str
    brief_reason: str


@router.post("/analyze/deep")
async def deep_analysis(req: DeepAnalysisRequest):
    """Perform deep cultural analysis of a movie for a target region."""
    db = get_db()

    # Check cache first
    cached = await db.alignments.find_one({
        "movie.title": {"$regex": f"^{req.movie_title}$", "$options": "i"},
        "target_region": req.target_region,
        "deep_analysis": {"$exists": True}
    })

    if cached:
        return {"cached": True, "data": cached["deep_analysis"]}

    # Generate deep analysis
    prompt = f"""
Perform a deep cultural analysis of "{req.movie_title}" for {req.target_region}.

Initial assessment: {req.label} (score: {req.score}/10)
Reasoning: {req.brief_reason}

Provide detailed analysis on:
1. Cultural themes and values alignment
2. Historical/political context relevance
3. Language and accessibility considerations
4. Content sensitivity in this region
5. Target audience demographics
6. Recommendations for enjoyment

Reply with ONLY raw JSON (no markdown):
{{"sections":{{"themes":"","context":"","language":"","content":"","audience":"","recommendations":""}},"generated_at":"datetime"}}
"""

    raw = await call_llm(prompt)
    parsed = safe_parse_json(raw)
    
    if not parsed:
        return {"cached": False, "data": {}}

    # Save to database
    try:
        await db.alignments.update_one(
            {
                "movie.title": {"$regex": f"^{req.movie_title}$", "$options": "i"},
                "target_region": req.target_region
            },
            {"$set": {"deep_analysis": parsed, "deep_analysis_generated_at": datetime.utcnow()}}
        )
    except Exception as e:
        print(f"[Deep Analysis] Failed to save to DB: {e}")

    return {"cached": False, "data": parsed}