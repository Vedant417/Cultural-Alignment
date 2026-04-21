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

from modules.tmdb   import fetch_movie, fetch_recommendations, fetch_genres
from modules.hybrid_fetcher import hybrid_fetch_movie
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
def _build_doc(movie_data, origin, target_region, score_data, recommendations=None, genres=None):
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
            recommendations=recommendations or [],
            genres=genres or [],
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

    print(f"[FETCH_MOVIE] {movie_data.get('title')}: poster_url={bool(movie_data.get('poster_url'))}, tmdb_id={movie_data.get('tmdb_id')}")

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

    # Fetch recommendations and genres
    tmdb_id = movie_data.get("tmdb_id")
    recommendations = []
    genres = []
    
    if tmdb_id:
        recommendations = await fetch_recommendations(str(tmdb_id))
        genres = await fetch_genres(str(tmdb_id))

    doc = _build_doc(movie_data, origin, request.target_region, score_data, recommendations, genres)

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


# ─────────────────────────────────────────────────────────────────# GET /api/analyze/genre-movies
# ─────────────────────────────────────────────────────────────────
@router.get("/analyze/genre-movies")
async def get_movies_by_genre(genre_name: str, limit: int = 20):
    """
    Get all movies in the database that have a specific genre.
    Returns movies with poster, title, and release date.
    """
    db = get_db()
    
    # Query all alignments and filter by genre in application layer
    all_alignments = await db.alignments.find({}).to_list(None)
    
    matching_movies = []
    seen_titles = set()  # Deduplicate by title
    
    for alignment in all_alignments:
        movie = alignment.get("movie", {})
        title = movie.get("title", "")
        
        if title in seen_titles:
            continue
        
        genres = movie.get("genres", [])
        genre_names = [g.get("name", "").lower() for g in genres if isinstance(g, dict)]
        
        if genre_name.lower() in genre_names:
            seen_titles.add(title)
            matching_movies.append({
                "title": title,
                "poster_url": movie.get("poster_url", ""),
                "release_date": movie.get("release_date", ""),
                "tmdb_id": movie.get("tmdb_id"),
            })
            
            if len(matching_movies) >= limit:
                break
    
    if not matching_movies:
        return {
            "genre": genre_name,
            "count": 0,
            "movies": [],
            "message": f"No movies found for genre: {genre_name}"
        }
    
    return {
        "genre": genre_name,
        "count": len(matching_movies),
        "movies": matching_movies,
    }


# ─────────────────────────────────────────────────────────────────# POST /api/analyze/compare
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze/compare", response_model=CompareResponse)
async def compare(request: CompareRequest):
    """Compare one movie across multiple regions."""

    movie_data = await hybrid_fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(404, "Movie not found")

    title = movie_data["title"]
    regions = list(dict.fromkeys(request.regions))

    # Fetch recommendations and genres once for all regions
    tmdb_id = movie_data.get("tmdb_id")
    recommendations = []
    genres = []
    
    if tmdb_id:
        recommendations = await fetch_recommendations(str(tmdb_id))
        genres = await fetch_genres(str(tmdb_id))

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

            doc_to_save = _build_doc(movie_data, origin, region, score_data_for_db, recommendations, genres)
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


# ─────────────────────────────────────────────────────────────────
# ✅ NEW: POST /api/analyze/explain
# ─────────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    title:   str
    region:  str
    summary: str


class ExplainResponse(BaseModel):
    language:   str
    religion:   str
    censorship: str
    audience:   str
    context:    str


@router.post("/analyze/explain", response_model=ExplainResponse)
async def explain_deeper(body: ExplainRequest):
    """
    Expand a brief cultural fit summary into a detailed breakdown
    covering: Language & Dialogue, Religion & Values, Censorship Risk,
    Audience Taste, and Historical/Political Context.
    """
    prompt = f"""
You are a senior cultural analyst. A film "{body.title}" received this
short cultural fit summary for {body.region}:

"{body.summary}"

Expand this into a detailed breakdown covering ALL of these factors:
1. Language & Dialogue
2. Religion & Values
3. Censorship Risk
4. Audience Taste
5. Historical/Political Context

Be specific and informative, 3-5 sentences per factor.
Return ONLY valid JSON with NO markdown fences, NO preamble:
{{"language":"...","religion":"...","censorship":"...","audience":"...","context":"..."}}
"""
    try:
        raw = await ollama_generate(prompt)
        if not raw:
            raise ValueError("Empty response from LLM")
        
        # Strip markdown fences if LLM adds them
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = extract_json_robust(clean)
        
        # Validate required fields
        required_fields = ["language", "religion", "censorship", "audience", "context"]
        missing_fields = [f for f in required_fields if f not in data or not data[f]]
        
        if missing_fields:
            raise ValueError(f"Missing fields in response: {missing_fields}")
        
        # Return validated response
        return ExplainResponse(**{
            "language": data.get("language", ""),
            "religion": data.get("religion", ""),
            "censorship": data.get("censorship", ""),
            "audience": data.get("audience", ""),
            "context": data.get("context", "")
        })
    
    except ValueError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[explain] Validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid response format: {str(e)}")
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[explain] Error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM explain failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze/deep
# ─────────────────────────────────────────────────────────────────

class DeepAnalysisRequest(BaseModel):
    movie_title:   str
    target_region: str
    score:         int
    label:         str
    brief_reason:  str


@router.post("/analyze/deep")
async def deep_analysis(req: DeepAnalysisRequest):
    """
    Generate a richer cultural analysis for a movie+region combo.
    ✅ NEW: Checks database cache first — if found, returns instantly!
    Only calls Ollama if not cached. After generating, saves to database.
    Uses the existing score/label as context so the LLM stays consistent.
    Called from the History page slide panel — does NOT re-fetch TMDB.
    """
    db = get_db()
    
    # ✅ Check cache in database
    cached_doc = await db.alignments.find_one({
        "movie.title":   {"$regex": f"^{req.movie_title}$", "$options": "i"},
        "target_region": req.target_region,
        "deep_analysis": {"$exists": True, "$ne": None}
    })
    
    if cached_doc and cached_doc.get("deep_analysis"):
        # Return cached analysis
        cached_analysis = cached_doc["deep_analysis"]
        print(f"[deep_analysis] ✅ Cache HIT for {req.movie_title} / {req.target_region}")
        return {
            "movie_title":    req.movie_title,
            "target_region":  req.target_region,
            "score":          req.score,
            "label":          req.label,
            "sections": cached_analysis.get("sections", {}),
            "cached": True,
        }
    
    # ✅ Not cached — call Ollama
    print(f"[deep_analysis] 🔄 Cache MISS for {req.movie_title} / {req.target_region} — calling Ollama...")
    
    prompt = (
        f'You are a senior cultural media analyst writing a detailed report.\n\n'
        f'Movie: "{req.movie_title}"\n'
        f'Country: {req.target_region}\n'
        f'Cultural Fit Score: {req.score}/10 ({req.label})\n'
        f'Brief context: {req.brief_reason}\n\n'
        f'Write a DETAILED cultural analysis report with these FIVE sections.\n'
        f'Each section: one clear heading + 2-3 specific sentences.\n'
        f'Be specific to {req.target_region} — mention real cultural references.\n\n'
        f'Reply ONLY with raw JSON, no markdown:\n'
        f'{{'
        f'"language_dialogue": "How language/dialogue fits or clashes with {req.target_region} audiences.",'
        f'"religion_values": "How the movie\'s values align with or challenge {req.target_region} norms.",'
        f'"censorship_risk": "Specific content that may face censorship in {req.target_region} and why.",'
        f'"audience_breakdown": "Which specific audience segments in {req.target_region} will love or avoid this.",'
        f'"historical_context": "Any historical or political context making this movie more/less relevant in {req.target_region}."'
        f'}}'
    )

    raw = await ollama_generate(prompt, timeout=240)
    if not raw:
        raise HTTPException(
            status_code=500,
            detail="Deep analysis timed out. Is Ollama/Groq running?"
        )

    parsed = extract_json_robust(raw)
    if not parsed:
        raise HTTPException(
            status_code=500,
            detail="Could not parse deep analysis response. Try again."
        )

    sections = {
        "language_dialogue":   parsed.get("language_dialogue", ""),
        "religion_values":     parsed.get("religion_values", ""),
        "censorship_risk":     parsed.get("censorship_risk", ""),
        "audience_breakdown":  parsed.get("audience_breakdown", ""),
        "historical_context":  parsed.get("historical_context", ""),
    }
    
    # ✅ Save to database cache
    try:
        await db.alignments.update_one(
            {
                "movie.title":   {"$regex": f"^{req.movie_title}$", "$options": "i"},
                "target_region": req.target_region,
            },
            {"$set": {"deep_analysis": {"sections": sections, "generated_at": datetime.utcnow()}}},
            upsert=False
        )
        print(f"[deep_analysis] 💾 Saved to cache for {req.movie_title} / {req.target_region}")
    except Exception as e:
        print(f"[deep_analysis] ⚠️ Failed to cache: {e}")
        # Don't fail the request if caching fails

    return {
        "movie_title":    req.movie_title,
        "target_region":  req.target_region,
        "score":          req.score,
        "label":          req.label,
        "sections": sections,
        "cached": False,
    }