import re
import httpx
from config import settings


def parse_input(raw_input: str) -> dict:
    """
    Detects input type from raw user input.
    Handles:
      - Leading/trailing whitespace (strip before anything)
      - http / https / no protocol
      - www. / m. subdomains
      - Trailing slash after movie ID  (imdb.com/title/tt1375666/)
      - Query params after ID          (?ref_=nv_sr_srsg_0)
      - Bare IMDB ID                   tt1375666
      - Plain title                    Inception
    """
    # ── Strip ALL whitespace first — fixes "paste + space" issue ──
    raw = raw_input.strip()

    if not raw:
        return {"type": "title", "value": ""}

    # ── TMDB link ─────────────────────────────────────────────────
    # themoviedb.org/movie/27205
    # themoviedb.org/movie/27205-inception
    # themoviedb.org/movie/27205/          ← trailing slash OK now
    # https://www.themoviedb.org/movie/27205?language=en
    tmdb_match = re.search(
        r"(?:https?://)?(?:www\.)?themoviedb\.org/movie/(\d+)(?:[-\w]*)?/?",
        raw, re.IGNORECASE
    )
    if tmdb_match:
        return {"type": "tmdb_id", "value": tmdb_match.group(1)}

    # ── IMDB link ─────────────────────────────────────────────────
    # https://www.imdb.com/title/tt1375666/
    # https://m.imdb.com/title/tt1375666/
    # http://imdb.com/title/tt1375666/?ref_=nv_sr_srsg_0
    # imdb.com/title/tt1375666            ← no protocol OK
    # imdb.com/title/tt1375666/           ← trailing slash OK now
    imdb_match = re.search(
        r"(?:https?://)?(?:www\.|m\.)?imdb\.com/title/(tt\d+)/?",
        raw, re.IGNORECASE
    )
    if imdb_match:
        return {"type": "imdb_id", "value": imdb_match.group(1)}

    # ── Bare IMDB ID ──────────────────────────────────────────────
    # tt1375666  or  tt1375666/
    bare_imdb = re.match(r"^(tt\d+)/?$", raw.strip())
    if bare_imdb:
        return {"type": "imdb_id", "value": bare_imdb.group(1)}

    # ── Plain title ───────────────────────────────────────────────
    return {"type": "title", "value": raw}


async def _build_movie_dict(movie: dict) -> dict:
    poster_path = movie.get("poster_path", "")
    return {
        "title":        movie.get("title", ""),
        "overview":     movie.get("overview", ""),
        "release_date": movie.get("release_date", ""),
        "language":     movie.get("original_language", ""),
        "poster_url":   f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "",
    }


async def fetch_by_tmdb_id(tmdb_id: str) -> dict | None:
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={"api_key": settings.TMDB_API_KEY})
            if resp.status_code == 200:
                return await _build_movie_dict(resp.json())
    except Exception:
        return None
    return None


async def fetch_by_imdb_id(imdb_id: str) -> dict | None:
    url = f"https://api.themoviedb.org/3/find/{imdb_id}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={
                "api_key": settings.TMDB_API_KEY,
                "external_source": "imdb_id",
            })
            results = resp.json().get("movie_results", [])
            if results:
                return await _build_movie_dict(results[0])
    except Exception:
        return None
    return None


async def fetch_by_title(title: str) -> dict | None:
    url = "https://api.themoviedb.org/3/search/movie"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={
                "api_key": settings.TMDB_API_KEY,
                "query": title,
            })
            results = resp.json().get("results", [])
            if results:
                return await _build_movie_dict(results[0])
    except Exception:
        return None
    return None


async def fetch_movie(raw_input: str) -> dict | None:
    """
    Main entry. Accepts title, TMDB link, IMDB link, bare IMDB ID.
    Input is always stripped of whitespace before any parsing.
    """
    parsed = parse_input(raw_input)

    if not parsed["value"]:
        return None

    if parsed["type"] == "tmdb_id":
        return await fetch_by_tmdb_id(parsed["value"])

    if parsed["type"] == "imdb_id":
        return await fetch_by_imdb_id(parsed["value"])

    return await fetch_by_title(parsed["value"])