from modules.ollama_client import ollama_generate, extract_json_robust


# ─── Single country score ─────────────────────────────────────────
async def get_cultural_score(
    movie_data: dict,
    target_region: str,
    state: str = ""
) -> dict:
    """
    Score a movie's cultural fit for ONE target region.
    Returns: { score, label, reason, content_flags, audience_note, similar_movies }
    """
    title    = movie_data["title"]
    lang     = movie_data.get("language", "en")
    overview = movie_data["overview"][:220].rsplit(" ", 1)[0]
    loc      = f"{state}, {target_region}" if state else target_region

    # Enhanced scoring reference table with cultural context
    scoring_guide = (
        "Scoring guide: "
        "10=perfect cultural fit (native language, deep cultural understanding), "
        "8-9=strong fit (same region/language or universal themes + relevant culture), "
        "6-7=moderate fit (global appeal but cultural nuances matter), "
        "4-5=weak fit (language/value mismatches affect enjoyment), "
        "2-3=poor fit (content conflicts with local cultural norms), "
        "1=very poor (likely offensive or culturally alien). "
        "Apply modifiers: Same language/region = +1-2 pts | Conservative region with adult/violence = -2 to -3 pts | "
        "Universal genre + global relevance = +1 pt | Niche/culturally specific film = -1 to -2 pts."
    )

    prompt = (
        f'You are a cultural media analyst. Evaluate this movie for {loc}.\n'
        f'Movie: "{title}" | Language: {lang}\n'
        f'Overview: {overview}\n\n'
        f'{scoring_guide}\n\n'
        f'IMPORTANT:\n'
        f'- Be specific to {target_region} culture, values, and audience preferences\n'
        f'- Explain WHY this score makes sense for {target_region} specifically\n'
        f'- Consider: content sensitivity, language accessibility, cultural themes, audience demographics\n'
        f'- Do NOT default to middle scores (6-7). Be decisive and justified.\n'
        f'- Reason must explain the cultural alignment/misalignment specific to {target_region}\n\n'
        f'Reply ONLY with raw JSON (no markdown):\n'
        f'{{"score":<int 1-10>,"label":"<Poor Fit|Weak Fit|Moderate Fit|Good Fit|Strong Fit|Perfect Fit>",'
        f'"reason":"<Explain in 2 sentences why this score for {target_region}: consider cultural themes, language, content sensitivity, and local audience preferences.>",'
        f'"content_flags":{{"violence":"<None|Mild|Moderate|High>",'
        f'"adult_content":"<None|Mild|Moderate|High>",'
        f'"religion_sensitivity":"<None|Low|Moderate|High>",'
        f'"drug_glorification":"<None|Mild|Moderate|High>"}},'
        f'"audience_note":"<One sentence describing which demographic in {target_region} would most enjoy this and why.>",'
        f'"similar_movies":['
        f'{{"title":"A","reason":"reason"}},'
        f'{{"title":"B","reason":"reason"}},'
        f'{{"title":"C","reason":"reason"}}'
        f']}}'
    )

    raw = await ollama_generate(prompt, timeout=300)
    if not raw:
        return {}

    parsed = extract_json_robust(raw)

    if "score" in parsed:
        try:
            parsed["score"] = max(1, min(10, int(parsed["score"])))
        except (ValueError, TypeError):
            parsed["score"] = None

    return parsed


# ─── Multi-country score — ONE Ollama call for ALL countries ──────
async def get_multi_cultural_scores(
    movie_data: dict,
    regions: list[str]
) -> list[dict]:
    """
    Score a movie for MULTIPLE countries in a SINGLE Ollama prompt.
    This is much faster than calling get_cultural_score() N times.

    Each region gets: score (1-10), label, reason (1 sentence explaining the score).

    Returns: list of { region, score, label, reason }
    """
    title    = movie_data["title"]
    lang     = movie_data.get("language", "en")
    overview = movie_data["overview"][:200].rsplit(" ", 1)[0]
    regions_str = ", ".join(regions)

    prompt = (
        f'You are a cultural media analyst specializing in cross-cultural content adaptation. Score this movie for MULTIPLE countries.\n\n'
        f'Movie: "{title}" | Language: {lang}\n'
        f'Overview: {overview}\n\n'
        f'Countries to score: {regions_str}\n\n'
        f'SCORING RULES:\n'
        f'- Score 1-10. Be realistic and varied — DO NOT give everyone the same score.\n'
        f'- Same language/culture as movie origin = 8-10 (native understanding)\n'
        f'- Universal genre (action/thriller) + western country = 6-8\n'
        f'- Language barrier (non-English film in English country) = -2 pts from base\n'
        f'- Conservative region (Middle East, South Asia) + adult/violence content = -3 pts from base\n'
        f'- Movie niche or culturally specific = lower scores (3-5) for distant countries\n'
        f'- Reason MUST explain SPECIFICALLY: Why is this score justified for THIS country? Consider cultural themes, values, content sensitivity, language, and target audience.\n\n'
        f'Reply ONLY with raw JSON (no markdown):\n'
        f'{{"scores":['
        f'{{"region":"Country","score":7,"label":"Good Fit","reason":"Explain specifically why for this region considering culture, language, and values."}},'
        f'... one entry per country'
        f']}}'
    )

    raw = await ollama_generate(prompt, timeout=360)  # slightly longer for multi
    if not raw:
        return []

    parsed = extract_json_robust(raw)
    scores = parsed.get("scores", [])

    # Validate and sanitize each entry
    result = []
    for entry in scores:
        if not isinstance(entry, dict):
            continue
        try:
            score = max(1, min(10, int(entry.get("score", 5))))
        except (ValueError, TypeError):
            score = None

        result.append({
            "region": entry.get("region", ""),
            "score":  score,
            "label":  entry.get("label", ""),
            "reason": entry.get("reason", ""),
        })

    return result