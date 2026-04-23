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
import asyncio

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
# COMPARE (FORWARD TO COMPARE ROUTER)
# ================================
class CompareRequestAnalyze(BaseModel):
    movie_input_a: str
    movie_input_b: str
    target_region: str


@router.post("/analyze/compare")
async def compare_two_movies_analyze(req: CompareRequestAnalyze):
    """
    Compare two movies for cultural alignment in a target region.
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

    # ── Check if both movies are the same ──
    movie_a_title_normalized = movie_a.get("title", "").lower().strip()
    movie_b_title_normalized = movie_b.get("title", "").lower().strip()
    
    if movie_a_title_normalized == movie_b_title_normalized:
        raise HTTPException(
            status_code=400,
            detail=f"You selected the same movie twice: '{movie_a.get('title')}'. Please select two different movies to compare."
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

    # ── Run AI comparison to determine winner ──
    score_a_val = score_a.get("score") or 0
    score_b_val = score_b.get("score") or 0
    score_difference = abs(score_a_val - score_b_val)
    is_tied = score_difference <= 0.5  # Within 0.5 point = tied
    
    print(f"[Comparison] Score A: {score_a_val}, Score B: {score_b_val}, Difference: {score_difference}")
    
    if is_tied:
        print(f"[Comparison] Scores are TIED - both movies equally culturally aligned")
        a_wins = True  # Mark both as "tied" will be handled on frontend
    else:
        print(f"[Comparison] Running AI to determine winner between '{movie_a['title']}' and '{movie_b['title']}'")
        comparison_prompt = f"""
        You are a cultural media analyst. Compare these TWO movies for the region: {req.target_region}
        
        Movie A: {movie_a['title']} ({movie_a.get('release_date', 'Unknown')})
        - Origin: {origin_a.get('region', 'Unknown')}
        - Cultural Fit Score: {score_a_val}/10
        - Analysis: {score_a.get('reason', 'No analysis available')}
        - Themes & Content: {score_a.get('label', 'Unknown')}
        
        Movie B: {movie_b['title']} ({movie_b.get('release_date', 'Unknown')})
        - Origin: {origin_b.get('region', 'Unknown')}
        - Cultural Fit Score: {score_b_val}/10
        - Analysis: {score_b.get('reason', 'No analysis available')}
        - Themes & Content: {score_b.get('label', 'Unknown')}
        
        TASK: Which movie is MORE culturally aligned for {req.target_region} audiences?
        
        FACTORS TO CONSIDER:
        - Cultural themes and values alignment with {req.target_region}
        - Language and accessibility
        - Content sensitivity (violence, adult themes, religion, drugs)
        - Audience demographics and preferences in {req.target_region}
        - Universal appeal vs cultural specificity
        
        Reply with ONLY raw JSON (no markdown):
        {{"winner": "A" or "B", "confidence": 1-10, "reason": "Why this movie is better for {req.target_region}. Explain specifically what makes it more culturally aligned."}}
        """
        
        ai_comparison_result = await call_llm(comparison_prompt, timeout=20)
        a_wins = True  # default
        
        if ai_comparison_result:
            try:
                comparison_data = safe_parse_json(ai_comparison_result)
                if comparison_data and comparison_data.get("winner") == "B":
                    a_wins = False
                print(f"[Comparison] AI Decision: {'A' if a_wins else 'B'} wins with confidence {comparison_data.get('confidence', 'N/A')}")
            except:
                print("[Comparison] Using score-based decision")
                a_wins = score_a_val >= score_b_val
        else:
            a_wins = score_a_val >= score_b_val

    # ── Save both to MongoDB (non-blocking) ──
    db = get_db()
    
    async def _save_compare(movie_data: dict, origin: dict, region: str, score_data: dict):
        try:
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
            await db.alignments.update_one(
                {
                    "movie.title": {"$regex": f"^{movie_data['title']}$", "$options": "i"},
                    "target_region": region
                },
                {"$set": doc.model_dump()},
                upsert=True
            )
        except Exception as e:
            print(f"[Save Compare] Error: {e}")
    
    asyncio.create_task(_save_compare(movie_a, origin_a, req.target_region, score_a))
    asyncio.create_task(_save_compare(movie_b, origin_b, req.target_region, score_b))

    def _build_compare_entry(movie_data: dict, origin: dict, score_data: dict, winner: bool) -> dict:
        flags_raw = score_data.get("content_flags", {})
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

    return {
        "target_region": req.target_region,
        "movie_a": _build_compare_entry(movie_a, origin_a, score_a, winner=a_wins),
        "movie_b": _build_compare_entry(movie_b, origin_b, score_b, winner=not a_wins),
    }


# ================================
# ANALYZE MULTI-COUNTRY
# ================================
class MultiCountryAnalyzeRequest(BaseModel):
    movie_input: str
    target_regions: list[str]


@router.post("/analyze/multi-country")
async def analyze_multi_country(request: MultiCountryAnalyzeRequest):
    """Analyze one movie across multiple countries."""
    import asyncio
    
    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(404, "Movie not found")

    origin = await detect_region(movie_data)

    tmdb_id = movie_data.get("tmdb_id")
    recs = await fetch_recommendations(str(tmdb_id)) if tmdb_id else []
    genres = await fetch_genres(str(tmdb_id)) if tmdb_id else []

    db = get_db()
    results = {}

    for region in request.target_regions:
        # Check cache first
        cached = await db.alignments.find_one({
            "movie.title": {"$regex": f"^{movie_data['title']}$", "$options": "i"},
            "target_region": region,
        })
        
        if cached:
            results[region] = {
                "id": str(cached["_id"]),
                "score": cached["result"]["score"],
                "label": cached["result"]["label"],
                "reason": cached["result"]["reason"],
                "audience_note": cached["result"]["audience_note"],
                "content_flags": cached["result"]["content_flags"],
                "cached": True
            }
            continue

        # Score for this region
        score_data = await get_cultural_score(movie_data, region)
        if not score_data:
            results[region] = {
                "score": None,
                "label": "Error",
                "reason": "Scoring failed",
                "audience_note": "",
                "content_flags": {},
                "cached": False
            }
            continue

        # Build and save document with upsert to prevent duplicates
        doc = _build_doc(movie_data, origin, region, score_data, recs, genres)
        result = await db.alignments.update_one(
            {
                "movie.title": {"$regex": f"^{movie_data['title']}$", "$options": "i"},
                "target_region": region
            },
            {"$set": doc.model_dump()},
            upsert=True
        )

        results[region] = {
            "id": str(result.upserted_id) if result.upserted_id else str(cached.get("_id", "")),
            "score": score_data.get("score"),
            "label": score_data.get("label", ""),
            "reason": score_data.get("reason", ""),
            "audience_note": score_data.get("audience_note", ""),
            "content_flags": score_data.get("content_flags", {}),
            "cached": False
        }

    return {
        "movie": movie_data,
        "results": results
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
        deep_data = cached.get("deep_analysis")
        if deep_data and isinstance(deep_data, dict):
            return {
                "movie_title": req.movie_title,
                "target_region": req.target_region,
                "score": req.score,
                "label": req.label,
                "sections": deep_data.get("sections", {})
            }

    # Generate deep analysis
    prompt = f"""
Perform a deep cultural analysis of "{req.movie_title}" for {req.target_region}.

Initial assessment: {req.label} (score: {req.score}/10)
Reasoning: {req.brief_reason}

Provide detailed analysis on:
1. Language and dialogue appropriateness for {req.target_region}
2. Religion and cultural values alignment
3. Censorship risk and content sensitivity
4. Target audience breakdown for {req.target_region}
5. Historical and political context relevance

Reply with ONLY raw JSON (no markdown):
{{"sections":{{"language_dialogue":"Explain how language, subtitles, and dialogue are appropriate for {req.target_region}","religion_values":"Explain how religious references and cultural values align with {req.target_region}","censorship_risk":"Assess risk of censorship or banning in {req.target_region}","audience_breakdown":"Describe ideal audience demographics in {req.target_region}","historical_context":"Explain historical or political context relevant to {req.target_region}"}}}}
"""

    raw = await call_llm(prompt)
    parsed = safe_parse_json(raw)
    
    if not parsed or not isinstance(parsed, dict) or "sections" not in parsed:
        # Return default sections on parse error
        return {
            "movie_title": req.movie_title,
            "target_region": req.target_region,
            "score": req.score,
            "label": req.label,
            "sections": {
                "language_dialogue": "Unable to generate analysis",
                "religion_values": "Unable to generate analysis",
                "censorship_risk": "Unable to generate analysis",
                "audience_breakdown": "Unable to generate analysis",
                "historical_context": "Unable to generate analysis"
            }
        }

    sections = parsed.get("sections", {})
    if not isinstance(sections, dict):
        sections = {
            "language_dialogue": "Unable to generate analysis",
            "religion_values": "Unable to generate analysis",
            "censorship_risk": "Unable to generate analysis",
            "audience_breakdown": "Unable to generate analysis",
            "historical_context": "Unable to generate analysis"
        }
    
    # Validate and normalize sections - ensure only string values with expected keys
    expected_keys = ["language_dialogue", "religion_values", "censorship_risk", "audience_breakdown", "historical_context"]
    normalized_sections = {}
    
    for expected_key in expected_keys:
        # Try to get value for this key
        value = sections.get(expected_key, "")
        
        # Convert to string if it's an object
        if isinstance(value, dict) or isinstance(value, list):
            value = json.dumps(value, indent=2)
        elif value is None:
            value = ""
        else:
            value = str(value)
        
        normalized_sections[expected_key] = value.strip() if value else "Unable to generate analysis"
    
    # If all sections are empty, return defaults
    if all(v == "Unable to generate analysis" or not v for v in normalized_sections.values()):
        normalized_sections = {
            "language_dialogue": "Unable to generate analysis",
            "religion_values": "Unable to generate analysis",
            "censorship_risk": "Unable to generate analysis",
            "audience_breakdown": "Unable to generate analysis",
            "historical_context": "Unable to generate analysis"
        }
    
    # Save to database
    try:
        await db.alignments.update_one(
            {
                "movie.title": {"$regex": f"^{req.movie_title}$", "$options": "i"},
                "target_region": req.target_region
            },
            {"$set": {"deep_analysis": {"sections": normalized_sections}, "deep_analysis_generated_at": datetime.utcnow()}}
        )
    except Exception as e:
        print(f"[Deep Analysis] Failed to save to DB: {e}")

    return {
        "movie_title": req.movie_title,
        "target_region": req.target_region,
        "score": req.score,
        "label": req.label,
        "sections": normalized_sections
    }