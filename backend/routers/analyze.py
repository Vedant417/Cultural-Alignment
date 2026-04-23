from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os
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
from backend.modules.ollama_client import ollama_generate, extract_json_robust

# ✅ GROQ SUPPORT
try:
    from groq import Groq
except:
    Groq = None

router = APIRouter(prefix="/api", tags=["analyze"])


# ================================
# ✅ LLM HANDLER (FIXED)
# ================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_llm_client():
    if GROQ_API_KEY and Groq:
        return Groq(api_key=GROQ_API_KEY)
    return None


async def call_llm(prompt: str, timeout: int = 60) -> str:
    client = get_llm_client()

    # ✅ Use GROQ (Production)
    if client:
        try:
            response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Groq ERROR] {e}")
            raise HTTPException(500, "LLM failed (Groq)")

    # ✅ Fallback: Ollama (Local)
    try:
        return await ollama_generate(prompt, timeout=timeout)
    except Exception as e:
        print(f"[Ollama ERROR] {e}")
        raise HTTPException(500, "No LLM provider available")


def parse_json_response(raw: str):
    raw = raw.strip().replace("```json", "").replace("```", "")
    return json.loads(raw)


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

    prompt = f"""
Recommend 3 movies similar to "{body.title}" for {body.region}.
Return JSON only.
"""

    raw = await call_llm(prompt)
    data = parse_json_response(raw)

    return {"recommendations": data}


# ================================
# EXPLAIN (FIXED)
# ================================
class ExplainRequest(BaseModel):
    title: str
    region: str
    summary: str


@router.post("/analyze/explain")
async def explain(body: ExplainRequest):

    prompt = f"""
Explain cultural fit of "{body.title}" in {body.region}.
Return JSON.
"""

    raw = await call_llm(prompt)
    return parse_json_response(raw)


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

    db = get_db()

    cached = await db.alignments.find_one({
        "movie.title": req.movie_title,
        "target_region": req.target_region,
        "deep_analysis": {"$exists": True}
    })

    if cached:
        return {"cached": True, "data": cached["deep_analysis"]}

    prompt = f"""
Deep analyze "{req.movie_title}" for {req.target_region}.
Return JSON.
"""

    raw = await call_llm(prompt)
    parsed = parse_json_response(raw)

    await db.alignments.update_one(
        {"movie.title": req.movie_title, "target_region": req.target_region},
        {"$set": {"deep_analysis": parsed}}
    )

    return {"cached": False, "data": parsed}