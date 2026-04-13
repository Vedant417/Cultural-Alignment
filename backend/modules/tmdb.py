import re
import httpx
from config import settings


def parse_input(raw_input: str) -> dict:
    """
    Detect whether the input is a plain title, a TMDB URL, or an IMDB URL.
    Returns: { "type": "title"|"tmdb_id"|"imdb_id", "value": str }
    """
    raw = raw_input.strip()

    # TMDB link: https://www.themoviedb.org/movie/27205  or  .../movie/27205-inception
    tmdb_match = re.search(
        r"themoviedb\.org/movie/(\d+)",
        raw, re.IGNORECASE
    )
    if tmdb_match:
        return {"type": "tmdb_id", "value": tmdb_match.group(1)}

    # IMDB link: https://www.imdb.com/title/tt1375666/
    imdb_match = re.search(
        r"imdb\.com/title/(tt\d+)",
        raw, re.IGNORECASE
    )
    if imdb_match:
        return {"type": "imdb_id", "value": imdb_match.group(1)}

    # Also handle bare IMDB IDs like "tt1375666"
    bare_imdb = re.match(r"^(tt\d+)$", raw.strip())
    if bare_imdb:
        return {"type": "imdb_id", "value": bare_imdb.group(1)}

    # Otherwise treat as plain title
    return {"type": "title", "value": raw}


async def _build_movie_dict(movie: dict) -> dict:
    """Extract the fields we need from a TMDB movie object."""
    poster_path = movie.get("poster_path", "")
    return {
        "title":        movie.get("title", ""),
        "overview":     movie.get("overview", ""),
        "release_date": movie.get("release_date", ""),
        "language":     movie.get("original_language", ""),
        "poster_url":   f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "",
    }


async def fetch_by_tmdb_id(tmdb_id: str) -> dict | None:
    """Fetch movie details directly using TMDB movie ID."""
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"api_key": settings.TMDB_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                return await _build_movie_dict(resp.json())
    except Exception:
        return None
    return None


async def fetch_by_imdb_id(imdb_id: str) -> dict | None:
    """
    Use TMDB's find endpoint to look up a movie by IMDB ID.
    Returns the first movie result.
    """
    url = f"https://api.themoviedb.org/3/find/{imdb_id}"
    params = {"api_key": settings.TMDB_API_KEY, "external_source": "imdb_id"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
            results = data.get("movie_results", [])
            if results:
                return await _build_movie_dict(results[0])
    except Exception:
        return None
    return None


async def fetch_by_title(title: str) -> dict | None:
    """Search TMDB by movie title, return best match."""
    url = "https://api.themoviedb.org/3/search/movie"
    params = {"api_key": settings.TMDB_API_KEY, "query": title}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
            if data.get("results"):
                return await _build_movie_dict(data["results"][0])
    except Exception:
        return None
    return None


async def fetch_movie(raw_input: str) -> dict | None:
    """
    Main entry point. Accepts:
    - Movie title: "Inception"
    - TMDB URL: "https://www.themoviedb.org/movie/27205-inception"
    - IMDB URL: "https://www.imdb.com/title/tt1375666/"
    - Bare IMDB ID: "tt1375666"

    Returns movie dict or None if not found.
    """
    parsed = parse_input(raw_input)

    if parsed["type"] == "tmdb_id":
        return await fetch_by_tmdb_id(parsed["value"])

    if parsed["type"] == "imdb_id":
        return await fetch_by_imdb_id(parsed["value"])

    # Default: title search
    return await fetch_by_title(parsed["value"])