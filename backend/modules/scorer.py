from modules.ollama_client import ollama_generate, extract_json_robust


async def get_cultural_score(movie_data: dict, region: str, state: str) -> dict:
    """
    Ask Ollama to score the movie's cultural fit (1-10) for its production region.
    Returns a dict with: score, label, reason, content_flags, audience_note, similar_movies.
    """
    loc      = f"{state}, {region}" if state else region
    short_ov = movie_data["overview"][:200].rsplit(" ", 1)[0]

    prompt = (
        f'You are a cultural media analyst. Movie: "{movie_data["title"]}". '
        f'Overview: {short_ov}. Region: {loc}. '
        f'Score cultural fit 1-10. Consider: violence/crime glorification '
        f'(penalise heavily if drug lords glorified in regions with crime issues), '
        f'adult content vs regional norms (conservative: Middle East/South Asia; liberal: West), '
        f'religion sensitivity, social relevance. '
        f'Dark themes explored critically = OK. Glorification = penalise. '
        f'audience_note: which fans enjoy this (positive, fan-centric). '
        f'similar_movies: 3 titles with genre/tone reason. '
        f'Reply ONLY with valid JSON, no explanation: '
        f'{{"score":7,"label":"Good Fit",'
        f'"reason":"Two clear sentences about cultural fit.",'
        f'"content_flags":{{"violence":"None",'
        f'"adult_content":"None",'
        f'"religion_sensitivity":"None",'
        f'"drug_glorification":"None"}},'
        f'"audience_note":"One sentence about ideal audience.",'
        f'"similar_movies":['
        f'{{"title":"Movie A","reason":"Similar tone"}},'
        f'{{"title":"Movie B","reason":"Same genre"}},'
        f'{{"title":"Movie C","reason":"Related theme"}}]}}'
    )

    raw = await ollama_generate(prompt, timeout=300)  # 5 min — CPU inference is slow
    if not raw:
        return {}
    return extract_json_robust(raw)