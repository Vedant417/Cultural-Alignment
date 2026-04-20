from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from modules.tmdb import fetch_movie
from modules.ollama_client import call_llm, parse_json_response

router = APIRouter(prefix="/api", tags=["compare"])


# ── Request Models ────────────────────────────────────────────────

class MovieVsMovieRequest(BaseModel):
    movie_a: str
    movie_b: str
    region:  str

    @field_validator("movie_a", "movie_b", mode="before")
    @classmethod
    def strip_input(cls, v):
        # Strip all leading/trailing whitespace including multiple spaces/newlines
        return v.strip() if isinstance(v, str) else v


# ─────────────────────────────────────────────────────────────────
# POST /api/compare/movie-vs-movie
# ─────────────────────────────────────────────────────────────────

@router.post("/compare/movie-vs-movie")
async def compare_movie_vs_movie(body: MovieVsMovieRequest):
    """
    Compare TWO movies in ONE country.
    Returns side-by-side analysis with scores + reasons.
    """
    # Fetch both movies in parallel
    import asyncio
    movie_a, movie_b = await asyncio.gather(
        fetch_movie(body.movie_a),
        fetch_movie(body.movie_b),
    )

    if not movie_a:
        raise HTTPException(400, f"Could not resolve movie A: '{body.movie_a[:60]}'")
    if not movie_b:
        raise HTTPException(400, f"Could not resolve movie B: '{body.movie_b[:60]}'")

    prompt = f"""
You are a cultural alignment analyst.
Compare these two movies for the region: {body.region}

Movie A: {movie_a['title']} ({movie_a.get('release_date','')[:4]})
Overview: {movie_a['overview'][:300]}

Movie B: {movie_b['title']} ({movie_b.get('release_date','')[:4]})
Overview: {movie_b['overview'][:300]}

For each movie provide score 1-10, label, and 2-3 sentence reason for {body.region}.

Return ONLY valid JSON with NO markdown fences:
{{"region":"{body.region}","movie_a":{{"title":"{movie_a['title']}","score":0,"label":"...","reason":"..."}},"movie_b":{{"title":"{movie_b['title']}","score":0,"label":"...","reason":"..."}}}}
"""
    try:
        raw   = await call_llm(prompt)
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return parse_json_response(clean)
    except Exception as e:
        raise HTTPException(500, f"LLM comparison failed: {str(e)}")