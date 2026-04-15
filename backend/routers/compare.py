@router.post("/compare/movie-vs-movie")
async def compare_movie_vs_movie(body: MovieVsMovieRequest):
    """
    Compare TWO movies in ONE country.
    Returns side-by-side analysis with scores + reasons.
    """
    movie_a = await fetch_movie(body.movie_a)
    movie_b = await fetch_movie(body.movie_b)
    if not movie_a or not movie_b:
        raise HTTPException(400, "Could not resolve one or both movies.")

    prompt = f"""
You are a cultural alignment analyst.
Compare these two movies for the region: {body.region}

Movie A: {movie_a['title']} ({movie_a.get('release_date','')[:4]})
Overview: {movie_a['overview'][:300]}

Movie B: {movie_b['title']} ({movie_b.get('release_date','')[:4]})
Overview: {movie_b['overview'][:300]}

For each movie provide:
- score: integer 1-10 (cultural fit for {body.region})
- label: one of "Perfect Fit" / "Strong Fit" / "Good Fit" / "Moderate Fit" / "Weak Fit" / "Poor Fit"
- reason: 2-3 sentence explanation

Return ONLY valid JSON:
{{
  "region": "{body.region}",
  "movie_a": {{"title":"...","score":0,"label":"...","reason":"..."}},
  "movie_b": {{"title":"...","score":0,"label":"...","reason":"..."}}
}}
"""
    raw = await call_llm(prompt)
    return parse_json_response(raw)