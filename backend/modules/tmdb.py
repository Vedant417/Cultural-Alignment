import re
import httpx
from config import settings


# ── Normalise helpers ─────────────────────────────────────────────────────────

def _normalise(raw: str) -> str:
    """
    Aggressively clean user input before any regex matching:
      1. Strip leading/trailing whitespace (all Unicode whitespace)
      2. Collapse internal whitespace runs to a single space
      3. Remove zero-width spaces and non-breaking spaces
      4. Decode %20 → space then re-strip (handles URL-encoded pastes)
      5. Strip trailing punctuation that users accidentally paste (., ;, )
    """
    if not raw:
        return ""

    # Remove zero-width / invisible chars
    cleaned = re.sub(r"[\u200b\u200c\u200d\ufeff\u00ad]", "", raw)

    # Replace non-breaking spaces with regular spaces
    cleaned = cleaned.replace("\u00a0", " ")

    # Replace carriage returns / tabs with spaces
    cleaned = cleaned.replace("\r\n", " ").replace("\r", " ").replace("\t", " ")

    # Decode URL-encoded spaces
    cleaned = cleaned.replace("%20", " ")

    # Strip leading/trailing whitespace
    cleaned = cleaned.strip()

    # Collapse multiple internal spaces to one
    cleaned = re.sub(r" {2,}", " ", cleaned)

    # Remove common accidentally-pasted trailing punctuation
    cleaned = re.sub(r"[.,;)\]]+$", "", cleaned).strip()

    return cleaned


def parse_input(raw_input: str) -> dict:
    """
    Detects input type from raw user input.

    Handles (after normalisation):
      - Leading/trailing whitespace of any kind
      - Multiple internal spaces  (e.g. "  https://  imdb .com …")
      - Zero-width / non-breaking spaces (mobile clipboard artefacts)
      - http / https / no protocol
      - www. / m. / www2. subdomains
      - Trailing slash after movie ID   (imdb.com/title/tt1375666/)
      - 2-3 slashes  (/title//tt1375666  browser bug)
      - Query params (?ref_=… ?language=… )
      - Hash fragments (#)
      - Bare IMDB ID  tt1375666 or tt1375666/
      - Plain title
    """
    raw = _normalise(raw_input)

    if not raw:
        return {"type": "title", "value": ""}

    # ── TMDB link ─────────────────────────────────────────────────────────────
    # Matches all of:
    #   https://www.themoviedb.org/movie/27205
    #   https://www.themoviedb.org/movie/27205-inception
    #   https://www.themoviedb.org/movie/27205/
    #   https://www.themoviedb.org/movie/27205?language=en-US
    #   themoviedb.org/movie/27205
    tmdb_match = re.search(
        r"(?:https?://\s*)?(?:www\.)?themoviedb\.org\s*/\s*movie\s*/+\s*(\d+)",
        raw, re.IGNORECASE
    )
    if tmdb_match:
        return {"type": "tmdb_id", "value": tmdb_match.group(1).strip()}

    # ── IMDB link ─────────────────────────────────────────────────────────────
    # Matches all of:
    #   https://www.imdb.com/title/tt1375666/
    #   https://m.imdb.com/title/tt1375666/
    #   http://imdb.com/title/tt1375666/?ref_=nv_sr_srsg_0
    #   imdb.com/title/tt1375666           (no protocol)
    #   imdb.com/title/tt1375666/          (trailing slash)
    #   imdb.com/title / tt1375666         (space around slash — normalised)
    #   https://www.imdb.com/title//tt1375666/  (double slash bug)
    imdb_match = re.search(
        r"(?:https?://\s*)?(?:www\.|m\.|www2\.)?imdb\.com\s*/\s*title\s*/+\s*(tt\d+)",
        raw, re.IGNORECASE
    )
    if imdb_match:
        return {"type": "imdb_id", "value": imdb_match.group(1).strip()}

    # ── Bare IMDB ID ─────────────────────────────────────────────────────────
    # tt1375666  tt1375666/  tt1375666 /
    bare_imdb = re.match(r"^(tt\d+)\s*/?$", raw.strip())
    if bare_imdb:
        return {"type": "imdb_id", "value": bare_imdb.group(1)}

    # ── Plain title ──────────────────────────────────────────────────────────
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
        pass
    return None


async def fetch_by_imdb_id(imdb_id: str) -> dict | None:
    url = f"https://api.themoviedb.org/3/find/{imdb_id}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={
                "api_key":         settings.TMDB_API_KEY,
                "external_source": "imdb_id",
            })
            results = resp.json().get("movie_results", [])
            if results:
                return await _build_movie_dict(results[0])
    except Exception:
        pass
    return None


async def fetch_by_title(title: str) -> dict | None:
    url = "https://api.themoviedb.org/3/search/movie"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={
                "api_key": settings.TMDB_API_KEY,
                "query":   title,
            })
            results = resp.json().get("results", [])
            if results:
                return await _build_movie_dict(results[0])
    except Exception:
        pass
    return None


async def fetch_movie(raw_input: str) -> dict | None:
    """
    Main entry point.
    Always normalises input fully before matching.
    Falls back to title search automatically if link parsing yields no result.
    """
    parsed = parse_input(raw_input)

    if not parsed["value"]:
        return None

    result = None

    if parsed["type"] == "tmdb_id":
        result = await fetch_by_tmdb_id(parsed["value"])

    elif parsed["type"] == "imdb_id":
        result = await fetch_by_imdb_id(parsed["value"])

    # If link-based lookup failed (TMDB API down, bad ID, etc.)
    # fall back to title search using the original raw input
    if result is None and parsed["type"] in ("tmdb_id", "imdb_id"):
        # Try the normalised raw as a title (last resort)
        fallback_title = _normalise(raw_input)
        result = await fetch_by_title(fallback_title)

    if result is None and parsed["type"] == "title":
        result = await fetch_by_title(parsed["value"])

    return result