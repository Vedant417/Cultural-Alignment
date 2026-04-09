import httpx
from config import settings


async def fetch_movie(movie_name: str) -> dict | None:
    """
    Search TMDB for a movie by name.
    Returns title, overview, release_date, language, poster_url — or None if not found.
    """
    url = "https://api.themoviedb.org/3/search/movie"
    params = {"api_key": settings.TMDB_API_KEY, "query": movie_name}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
            if data.get("results"):
                movie = data["results"][0]
                poster_path = movie.get("poster_path", "")
                poster_url = (
                    f"https://image.tmdb.org/t/p/w500{poster_path}"
                    if poster_path else ""
                )
                return {
                    "title":        movie.get("title", ""),
                    "overview":     movie.get("overview", ""),
                    "release_date": movie.get("release_date", ""),
                    "language":     movie.get("original_language", ""),
                    "poster_url":   poster_url,
                }
    except Exception:
        return None
    return None