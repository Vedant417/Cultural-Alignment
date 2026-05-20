import re
import httpx
from ..config import settings
from .tmdb import parse_input, fetch_by_title, fetch_by_tmdb_id, fetch_by_imdb_id


async def fetch_from_omdb(imdb_id: str = None, title: str = None) -> dict | None:
    """Fetch movie data from OMDb API."""
    if not settings.OMDB_API_KEY:
        return None
    
    url = "http://www.omdbapi.com/"
    params = {"apikey": settings.OMDB_API_KEY, "type": "movie"}
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if imdb_id:
                params["i"] = imdb_id
            elif title:
                params["t"] = title
            else:
                return None
            
            resp = await client.get(url, params=params)
            data = resp.json()
            
            if data.get("Response") == "True":
                return {
                    "title": data.get("Title", ""),
                    "overview": data.get("Plot", ""),
                    "release_date": data.get("Released", ""),
                    "language": data.get("Language", "").split(",")[0].strip() if data.get("Language") else "",
                    "poster_url": data.get("Poster", ""),
                    "imdb_id": data.get("imdbID", ""),
                    "source": "omdb"
                }
    except Exception as e:
        print(f"[omdb] Error: {e}")
    
    return None


async def fetch_from_wikidata(title: str = None, imdb_id: str = None) -> dict | None:
    """Enrich movie data from Wikidata using SPARQL."""
    if not title and not imdb_id:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # SPARQL query to find movie
            if imdb_id:
                query = f"""
                SELECT ?item ?itemLabel ?countryLabel ?languageLabel ?filmingLocationLabel WHERE {{
                  ?item wdt:P345 "{imdb_id}" .
                  OPTIONAL {{ ?item wdt:P495 ?country . ?country rdfs:label ?countryLabel . FILTER(LANG(?countryLabel) = "en") }}
                  OPTIONAL {{ ?item wdt:P364 ?language . ?language rdfs:label ?languageLabel . FILTER(LANG(?languageLabel) = "en") }}
                  OPTIONAL {{ ?item wdt:P915 ?filmingLocation . ?filmingLocation rdfs:label ?filmingLocationLabel . FILTER(LANG(?filmingLocationLabel) = "en") }}
                  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
                }}
                LIMIT 1
                """
            else:
                query = f"""
                SELECT ?item ?itemLabel ?countryLabel ?languageLabel ?filmingLocationLabel WHERE {{
                  ?item rdfs:label "{title}"@en .
                  ?item wdt:P31 wd:Q11424 .
                  OPTIONAL {{ ?item wdt:P495 ?country . ?country rdfs:label ?countryLabel . FILTER(LANG(?countryLabel) = "en") }}
                  OPTIONAL {{ ?item wdt:P364 ?language . ?language rdfs:label ?languageLabel . FILTER(LANG(?languageLabel) = "en") }}
                  OPTIONAL {{ ?item wdt:P915 ?filmingLocation . ?filmingLocation rdfs:label ?filmingLocationLabel . FILTER(LANG(?filmingLocationLabel) = "en") }}
                  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
                }}
                LIMIT 1
                """
            
            url = "https://query.wikidata.org/sparql"
            resp = await client.get(url, params={"query": query, "format": "json"})
            
            if resp.status_code == 200:
                results = resp.json().get("results", {}).get("bindings", [])
                if results:
                    binding = results[0]
                    return {
                        "country_of_origin": binding.get("countryLabel", {}).get("value", ""),
                        "original_language_wiki": binding.get("languageLabel", {}).get("value", ""),
                        "filming_location": binding.get("filmingLocationLabel", {}).get("value", ""),
                        "source": "wikidata"
                    }
    except Exception as e:
        print(f"[wikidata] Error: {e}")
    
    return None


async def hybrid_fetch_movie(raw_input: str) -> dict | None:
    """
    Hybrid movie fetching orchestrator.
    
    Priority: TMDb → OMDb → Title search
    Enrichment: Wikidata (optional, doesn't block)
    
    Returns complete movie data with source info.
    """
    parsed = parse_input(raw_input)
    
    if not parsed["value"]:
        return None
    
    movie_data = None
    source_used = []
    
    # Step 1: Try primary source based on input type
    if parsed["type"] == "tmdb_id":
        movie_data = await fetch_by_tmdb_id(parsed["value"])
        if movie_data:
            source_used.append("tmdb_id")
    
    elif parsed["type"] == "imdb_id":
        # Try TMDb first (via IMDb ID mapping)
        movie_data = await fetch_by_imdb_id(parsed["value"])
        if movie_data:
            source_used.append("tmdb_via_imdb")
        else:
            # Fall back to OMDb for IMDb links
            movie_data = await fetch_from_omdb(imdb_id=parsed["value"])
            if movie_data:
                source_used.append("omdb")
    
    elif parsed["type"] == "title":
        movie_data = await fetch_by_title(parsed["value"])
        if movie_data:
            source_used.append("tmdb")
    
    # Step 2: If primary failed, try fallback search
    if movie_data is None:
        fallback_title = parsed["value"] if parsed["type"] == "title" else raw_input
        movie_data = await fetch_by_title(fallback_title)
        if movie_data:
            source_used.append("tmdb_fallback")
        else:
            # Try OMDb as last resort
            movie_data = await fetch_from_omdb(title=fallback_title)
            if movie_data:
                source_used.append("omdb_fallback")
    
    if movie_data is None:
        return None
    
    # Step 3: Enrich with Wikidata (doesn't block, optional)
    try:
        wiki_data = await fetch_from_wikidata(
            title=movie_data.get("title"),
            imdb_id=movie_data.get("imdb_id")
        )
        if wiki_data:
            movie_data.update(wiki_data)
            source_used.append("wikidata")
    except Exception:
        pass
    
    # Add source tracking
    movie_data["data_sources"] = source_used
    
    return movie_data
