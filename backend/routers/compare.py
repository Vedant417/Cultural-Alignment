from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.db.connection import get_db
from backend.db.models import MovieInfo, RegionInfo, AnalysisResult, AlignmentDocument, ContentFlags, SimilarMovie
from backend.modules.tmdb import fetch_movie
from backend.modules.hybrid_fetcher import hybrid_fetch_movie
from backend.modules.region import detect_region
from backend.modules.scorer import get_cultural_score
from backend.modules.llm import call_llm, safe_parse_json
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
        # Use upsert to prevent duplicates: if same movie+region exists, update it; otherwise insert
        await db.alignments.update_one(
            {
                "movie.title": {"$regex": f"^{movie_data['title']}$", "$options": "i"},
                "target_region": region
            },
            {"$set": doc.model_dump()},
            upsert=True
        )
    except Exception:
        pass


@router.post("/two-movies")
async def compare_two_movies(req: TwoMovieRequest):
    if not req.movie_input_a.strip():
        raise HTTPException(status_code=400, detail="Movie A is required.")
    if not req.movie_input_b.strip():
        raise HTTPException(status_code=400, detail="Movie B is required.")
    if not req.target_region.strip():
        raise HTTPException(status_code=400, detail="Target region is required.")

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

    movie_a_title_normalized = movie_a.get("title", "").lower().strip()
    movie_b_title_normalized = movie_b.get("title", "").lower().strip()
    
    if movie_a_title_normalized == movie_b_title_normalized:
        raise HTTPException(
            status_code=400,
            detail=f"You selected the same movie twice: '{movie_a.get('title')}'. Please select two different movies to compare."
        )

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

    score_a_val = score_a.get("score") or 0
    score_b_val = score_b.get("score") or 0
    score_difference = abs(score_a_val - score_b_val)
    is_tied = score_difference <= 0.5
    if is_tied:
        a_wins = True  # Mark both as "tied" will be handled on frontend
    else:
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
            except:
                a_wins = score_a_val >= score_b_val
        else:
            a_wins = score_a_val >= score_b_val

    asyncio.create_task(_save_to_db(movie_a, origin_a, req.target_region, score_a))
    asyncio.create_task(_save_to_db(movie_b, origin_b, req.target_region, score_b))

    return {
        "target_region": req.target_region,
        "movie_a": _build_compare_entry(movie_a, origin_a, score_a, winner=a_wins),
        "movie_b": _build_compare_entry(movie_b, origin_b, score_b, winner=not a_wins),
    }


@router.post("/check-cached")
async def check_two_movies_cached(req: TwoMovieRequest):
    db = get_db()
    
    try:
        # Try to find both analyses in DB for this region
        movie_a_doc = await db.alignments.find_one({
            "movie.title": {"$regex": f"^{req.movie_input_a}$", "$options": "i"},
            "target_region": req.target_region,
        })
        
        movie_b_doc = await db.alignments.find_one({
            "movie.title": {"$regex": f"^{req.movie_input_b}$", "$options": "i"},
            "target_region": req.target_region,
        })
        
        if not movie_a_doc or not movie_b_doc:
            raise HTTPException(status_code=404, detail="Comparison not cached")
        
        # Build response with winner logic
        score_a = movie_a_doc["result"]["score"] or 0
        score_b = movie_b_doc["result"]["score"] or 0
        a_wins = score_a >= score_b
        
        return {
            "target_region": req.target_region,
            "movie_a": {
                "movie": movie_a_doc["movie"],
                "origin_region": movie_a_doc["origin_region"],
                "score": score_a,
                "label": movie_a_doc["result"].get("label", ""),
                "reason": movie_a_doc["result"].get("reason", ""),
                "audience_note": movie_a_doc["result"].get("audience_note", ""),
                "content_flags": movie_a_doc["result"]["content_flags"],
                "winner": a_wins,
            },
            "movie_b": {
                "movie": movie_b_doc["movie"],
                "origin_region": movie_b_doc["origin_region"],
                "score": score_b,
                "label": movie_b_doc["result"].get("label", ""),
                "reason": movie_b_doc["result"].get("reason", ""),
                "audience_note": movie_b_doc["result"].get("audience_note", ""),
                "content_flags": movie_b_doc["result"]["content_flags"],
                "winner": not a_wins,
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Comparison not cached")