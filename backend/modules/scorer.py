from modules.ollama_client import ollama_generate, extract_json_robust


async def get_cultural_score(
    movie_data: dict,
    target_region: str,
    state: str = ""
) -> dict:
    """
    Score a movie's cultural fit for a SPECIFIC TARGET REGION (user-chosen).
    This is NOT the production country — this is where the user wants to check fit.

    Returns: { score, label, reason, content_flags, audience_note, similar_movies }
    """
    title    = movie_data["title"]
    lang     = movie_data.get("language", "en")
    overview = movie_data["overview"][:250].rsplit(" ", 1)[0]
    loc      = f"{state}, {target_region}" if state else target_region

    prompt = (
        f'You are a strict cultural media analyst scoring movies for specific countries.\n\n'
        f'Movie title: "{title}"\n'
        f'Original language: {lang}\n'
        f'Overview: {overview}\n'
        f'Target country to score for: {loc}\n\n'

        f'CRITICAL SCORING RULES — scores MUST be realistic and varied:\n'
        f'- Score 9-10: Movie is FROM this country OR its themes deeply match local culture\n'
        f'- Score 7-8: Strong cultural resonance despite some gaps\n'
        f'- Score 5-6: Some appeal but noticeable cultural distance or language barrier\n'
        f'- Score 3-4: Poor fit — themes, values, or content conflict with local norms\n'
        f'- Score 1-2: Very poor fit — content may offend or be completely alien\n\n'

        f'CALIBRATION EXAMPLES (use these to calibrate your score):\n'
        f'- Bollywood Hindi film scored for India → 9 or 10\n'
        f'- Bollywood Hindi film scored for France → 3 or 4 (language barrier + cultural gap)\n'
        f'- Hollywood English film scored for United States → 8 or 9\n'
        f'- Hollywood action film scored for Japan → 6 (action appeals, but values differ)\n'
        f'- KGF (Kannada) scored for India → 9 (pan-India mass appeal)\n'
        f'- KGF (Kannada) scored for Germany → 3 (over-the-top style, cultural mismatch)\n'
        f'- Parasite (Korean) scored for South Korea → 10\n'
        f'- Parasite (Korean) scored for United States → 7 (universal class themes)\n'
        f'- Parasite (Korean) scored for India → 5 (class themes resonate but style is foreign)\n'
        f'- Violent gangster film scored for UAE → 2 (strict content norms)\n\n'

        f'Consider these cultural factors for {target_region}:\n'
        f'- Language match (same language = +2 to +3 points)\n'
        f'- Content norms (conservative regions penalize violence/adult content heavily)\n'
        f'- Thematic relevance (does the story resonate with local society?)\n'
        f'- Genre appeal (action is universal; social drama is culture-specific)\n\n'

        f'Do NOT default to 7 or 8. If the movie is from a different culture, the score '
        f'should reflect REAL cultural distance. Be honest and specific.\n\n'

        f'Reply ONLY with valid raw JSON (no markdown, no explanation):\n'
        f'{{'
        f'"score": <integer 1-10>,'
        f'"label": "<Poor Fit|Weak Fit|Moderate Fit|Good Fit|Strong Fit|Perfect Fit>",'
        f'"reason": "<Two specific sentences explaining the score for {target_region}>.",'
        f'"content_flags": {{'
        f'"violence": "<None|Mild|Moderate|High>",'
        f'"adult_content": "<None|Mild|Moderate|High>",'
        f'"religion_sensitivity": "<None|Low|Moderate|High>",'
        f'"drug_glorification": "<None|Mild|Moderate|High>"'
        f'}},'
        f'"audience_note": "<One sentence about who in {target_region} would enjoy this>.",'
        f'"similar_movies": ['
        f'{{"title": "Movie A", "reason": "Similar tone or theme"}},'
        f'{{"title": "Movie B", "reason": "Same genre"}},'
        f'{{"title": "Movie C", "reason": "Related cultural context"}}'
        f']'
        f'}}'
    )

    raw = await ollama_generate(prompt, timeout=300)
    if not raw:
        return {}

    parsed = extract_json_robust(raw)

    # Ensure score is actually an integer
    if "score" in parsed:
        try:
            parsed["score"] = int(parsed["score"])
            # Clamp to 1-10
            parsed["score"] = max(1, min(10, parsed["score"]))
        except (ValueError, TypeError):
            parsed["score"] = None

    return parsed