from modules.ollama_client import ollama_generate, extract_json_robust


# ─── Single country score ─────────────────────────────────────────
async def get_cultural_score(
    movie_data: dict,
    target_region: str,
    state: str = ""
) -> dict:
    title    = movie_data["title"]
    lang     = movie_data.get("language", "en")
    overview = movie_data["overview"][:220].rsplit(" ", 1)[0]
    loc      = f"{state}, {target_region}" if state else target_region

    scoring_guide = (
        "Scoring guide: "
        "10=perfect native fit, "
        "8-9=strong fit (same region/language), "
        "6-7=moderate fit (global appeal but cultural gap), "
        "4-5=weak fit (language barrier or value mismatch), "
        "2-3=poor fit (content conflicts with local norms), "
        "1=very poor (likely offensive or alien). "
        "Same language as target = +2 pts. "
        "Conservative region (Middle East, South Asia) + adult/violence content = -2 to -3 pts."
    )

    prompt = (
        f'Rate this movie for {loc}. Movie: "{title}". '
        f'Language: {lang}. Overview: {overview}. '
        f'{scoring_guide} '
        f'Be specific to {target_region} culture. Do not default to 7 or 8. '
        f'Reply ONLY with raw JSON:\n'
        f'{{"score":<int 1-10>,"label":"<Poor Fit|Weak Fit|Moderate Fit|Good Fit|Strong Fit|Perfect Fit>",'
        f'"reason":"<Two sentences specific to {target_region}>.",'
        f'"content_flags":{{"violence":"<None|Mild|Moderate|High>",'
        f'"adult_content":"<None|Mild|Moderate|High>",'
        f'"religion_sensitivity":"<None|Low|Moderate|High>",'
        f'"drug_glorification":"<None|Mild|Moderate|High>"}},'
        f'"audience_note":"<One sentence about who in {target_region} would enjoy this>.",'
        f'"similar_movies":['
        f'{{"title":"A","reason":"reason"}},'
        f'{{"title":"B","reason":"reason"}},'
        f'{{"title":"C","reason":"reason"}}'
        f']}}'
    )

    # ⏱ Reduced timeout for faster response
    raw = await ollama_generate(prompt, timeout=120)

    # 🛑 Fallback if AI fails
    if not raw:
        return {
            "score": 5,
            "label": "Moderate Fit",
            "reason": f"AI service unavailable. Default fallback for {target_region}.",
            "content_flags": {
                "violence": "Unknown",
                "adult_content": "Unknown",
                "religion_sensitivity": "Unknown",
                "drug_glorification": "Unknown"
            },
            "audience_note": "Fallback result due to AI issue.",
            "similar_movies": []
        }

    parsed = extract_json_robust(raw)

    # 🧠 Ensure valid score
    if "score" in parsed:
        try:
            parsed["score"] = max(1, min(10, int(parsed["score"])))
        except (ValueError, TypeError):
            parsed["score"] = 5

    return parsed


# ─── Multi-country score ─────────────────────────────────────────
async def get_multi_cultural_scores(
    movie_data: dict,
    regions: list[str]
) -> list[dict]:

    title    = movie_data["title"]
    lang     = movie_data.get("language", "en")
    overview = movie_data["overview"][:200].rsplit(" ", 1)[0]
    regions_str = ", ".join(regions)

    prompt = (
        f'You are a cultural media analyst. Score this movie for MULTIPLE countries.\n\n'
        f'Movie: "{title}" | Language: {lang}\n'
        f'Overview: {overview}\n\n'
        f'Countries to score: {regions_str}\n\n'
        f'Rules:\n'
        f'- Score 1-10. Be realistic and varied — DO NOT give everyone the same score.\n'
        f'- Same language/culture as movie origin = 8-10\n'
        f'- Universal genre (action/thriller) + western country = 6-8\n'
        f'- Language barrier (non-English film in English country) = -2 pts\n'
        f'- Conservative region (Middle East) + adult/violence content = -3 pts\n'
        f'- Movie niche or culturally specific = lower scores for distant countries\n'
        f'- reason must be ONE sentence explaining specifically why that score for that country\n\n'
        f'Reply ONLY with raw JSON, no markdown:\n'
        f'{{"scores":['
        f'{{"region":"Country","score":7,"label":"Good Fit","reason":"One sentence."}},'
        f'... one entry per country'
        f']}}'
    )

    raw = await ollama_generate(prompt, timeout=150)

    # 🛑 Fallback if AI fails
    if not raw:
        return [
            {
                "region": r,
                "score": 5,
                "label": "Moderate Fit",
                "reason": "Fallback result (AI unavailable)"
            }
            for r in regions
        ]

    parsed = extract_json_robust(raw)
    scores = parsed.get("scores", [])

    result = []
    for entry in scores:
        if not isinstance(entry, dict):
            continue
        try:
            score = max(1, min(10, int(entry.get("score", 5))))
        except (ValueError, TypeError):
            score = 5

        result.append({
            "region": entry.get("region", ""),
            "score":  score,
            "label":  entry.get("label", ""),
            "reason": entry.get("reason", ""),
        })

    return result