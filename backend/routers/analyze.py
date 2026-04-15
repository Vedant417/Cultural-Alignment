from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from db.connection import get_db
from db.models import (
    AnalyzeRequest, CompareRequest, CompareResponse,
    AlignmentDocument, ComparisonEntry,
    MovieInfo, RegionInfo, AnalysisResult,
    ContentFlags, SimilarMovie,
)

from modules.tmdb   import fetch_movie
from modules.region import detect_region
from modules.scorer import get_cultural_score, get_multi_cultural_scores
from modules.ollama_client import ollama_generate, extract_json_robust

router = APIRouter(prefix="/api", tags=["analyze"])


# ── Cache lookup ──────────────────────────────────────────────────
async def _get_cached(title: str, target_region: str) -> dict | None:
    db = get_db()
    return await db.alignments.find_one({
        "movie.title":   {"$regex": f"^{title}$", "$options": "i"},
        "target_region": target_region,
    })


# ── Build AlignmentDocument ───────────────────────────────────────
def _build_doc(movie_data, origin, target_region, score_data):
    flags_raw   = score_data.get("content_flags", {})
    similar_raw = score_data.get("similar_movies", [])

    sub = score_data.get("sub_scores") or {}

    safe_flags = {
        "violence":             flags_raw.get("violence", "None"),
        "adult_content":        flags_raw.get("adult_content", "None"),
        "religion_sensitivity": flags_raw.get("religion_sensitivity", "None"),
        "drug_glorification":   flags_raw.get("drug_glorification", "None"),
    }

    return AlignmentDocument(
        searched_at=datetime.utcnow(),
        movie=MovieInfo(**movie_data),
        origin_region=RegionInfo(
            region=origin.get("region", "Unknown"),
            state=origin.get("state", ""),
            lat=float(origin.get("lat", 0.0)),
            lon=float(origin.get("lon", 0.0)),
        ),
        target_region=target_region,
        result=AnalysisResult(
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            reason=score_data.get("reason", ""),

            # ✅ NEW
            sub_scores={
                "cultural_fit": sub.get("cultural_fit"),
                "censorship_risk": sub.get("censorship_risk"),
                "language_fit": sub.get("language_fit"),
                "market_appeal": sub.get("market_appeal"),
            },

            content_flags=ContentFlags(**safe_flags),
            audience_note=score_data.get("audience_note", ""),
            similar_movies=[
                SimilarMovie(**sm)
                for sm in similar_raw[:3]
                if isinstance(sm, dict)
            ],
        )
    )


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):

    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(404, f"Movie not found: '{request.movie_input}'")

    cached_doc = await _get_cached(movie_data["title"], request.target_region)
    if cached_doc:
        cached_doc["id"] = str(cached_doc.pop("_id"))
        if isinstance(cached_doc.get("searched_at"), datetime):
            cached_doc["searched_at"] = cached_doc["searched_at"].isoformat()
        return {**cached_doc, "cached": True}

    origin = await detect_region(movie_data)

    score_data = await get_cultural_score(
        movie_data,
        target_region=request.target_region
    )

    if not score_data:
        raise HTTPException(500, "Scoring failed")

    doc = _build_doc(movie_data, origin, request.target_region, score_data)

    db = get_db()
    result = await db.alignments.insert_one(doc.model_dump())

    return {
        "id": str(result.inserted_id),
        "searched_at": doc.searched_at.isoformat(),
        "movie": doc.movie.model_dump(),
        "origin_region": doc.origin_region.model_dump(),
        "target_region": doc.target_region,
        "result": doc.result.model_dump(),  # ✅ now includes sub_scores
        "cached": False,
    }


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze/compare
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze/compare", response_model=CompareResponse)
async def compare(request: CompareRequest):

    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(404, "Movie not found")

    title = movie_data["title"]
    regions = list(dict.fromkeys(request.regions))

    cached_entries = []
    uncached_regions = []

    for region in regions:
        doc = await _get_cached(title, region)
        if doc:
            r = doc.get("result", {})
            cached_entries.append(ComparisonEntry(
                region=region,
                score=r.get("score"),
                label=r.get("label", ""),
                reason=r.get("reason", "")[:120],
                cached=True,

                # ✅ include sub_scores
                sub_scores=r.get("sub_scores")
            ))
        else:
            uncached_regions.append(region)

    fresh_entries = []

    if uncached_regions:
        raw_scores = await get_multi_cultural_scores(movie_data, uncached_regions)

        origin = {"region": "Unknown", "state": "", "lat": 0.0, "lon": 0.0}

        for entry in raw_scores:
            region = entry.get("region", "")
            if not region:
                continue

            score_data_for_db = {
                "score": entry.get("score"),
                "label": entry.get("label", ""),
                "reason": entry.get("reason", ""),
                "sub_scores": entry.get("sub_scores"),  # ✅ important
                "content_flags": {},
                "audience_note": "",
                "similar_movies": [],
            }

            doc_to_save = _build_doc(movie_data, origin, region, score_data_for_db)
            db = get_db()
            await db.alignments.insert_one(doc_to_save.model_dump())

            fresh_entries.append(ComparisonEntry(
                region=region,
                score=entry.get("score"),
                label=entry.get("label", ""),
                reason=entry.get("reason", ""),
                cached=False,
                sub_scores=entry.get("sub_scores"),  # ✅ important
            ))

    all_entries = cached_entries + fresh_entries
    all_entries.sort(key=lambda e: (e.score or 0), reverse=True)

    return CompareResponse(
        movie=MovieInfo(**movie_data),
        entries=all_entries,
    )


# ─────────────────────────────────────────────────────────────────
# ✅ NEW: POST /api/analyze/recommend
# ─────────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    title:  str
    region: str
    score:  int
    genre:  str = ""


@router.post("/analyze/recommend")
async def recommend(body: RecommendRequest):
    """
    Recommend 3 culturally-aligned movies for a given region,
    based on a reference movie's score and genre context.
    """
    # Validate score range
    if not (1 <= body.score <= 10):
        raise HTTPException(400, "Score must be between 1 and 10")

    prompt = f"""
The movie "{body.title}" scored {body.score}/10 for cultural fit in {body.region}.
Genre context: {body.genre or 'not specified'}.

Recommend exactly 3 OTHER movies that would have HIGH cultural fit for {body.region}
and would appeal to fans of "{body.title}".

Return ONLY valid JSON as an array:
[
  {{"title": "...", "reason": "1 sentence why it fits {body.region}", "expected_score": 7}},
  {{"title": "...", "reason": "...", "expected_score": 8}},
  {{"title": "...", "reason": "...", "expected_score": 9}}
]
"""
    try:
        raw = await call_llm(prompt)
        recommendations = parse_json_response(raw)
        
        # Basic validation of response structure
        if not isinstance(recommendations, list) or len(recommendations) != 3:
            raise ValueError("Response must be an array of exactly 3 items")
        
        for i, rec in enumerate(recommendations):
            if not all(k in rec for k in ("title", "reason", "expected_score")):
                raise ValueError(f"Recommendation #{i+1} missing required fields")
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        # Log error internally, return user-friendly message
        print(f"[recommend] Error: {e}")
        raise HTTPException(500, "Failed to generate recommendations. Please try again.")