from modules.ollama_client import ollama_generate, extract_json_robust

LANGUAGE_TO_COUNTRY: dict[str, dict] = {
    # -------- GLOBAL --------
    "en_us": {"region": "United States", "state": "California", "lat": 34.0522, "lon": -118.2437},
    "en_uk": {"region": "United Kingdom", "state": "London", "lat": 51.5074, "lon": -0.1278},
    "fr": {"region": "France", "state": "Paris", "lat": 48.8566, "lon": 2.3522},
    "es": {"region": "Spain", "state": "Madrid", "lat": 40.4168, "lon": -3.7038},
    "de": {"region": "Germany", "state": "Berlin", "lat": 52.5200, "lon": 13.4050},
    "it": {"region": "Italy", "state": "Rome", "lat": 41.9028, "lon": 12.4964},
    "pt": {"region": "Portugal", "state": "Lisbon", "lat": 38.7223, "lon": -9.1393},
    "ru": {"region": "Russia", "state": "Moscow", "lat": 55.7558, "lon": 37.6173},
    "zh": {"region": "China", "state": "Beijing", "lat": 39.9042, "lon": 116.4074},
    "ja": {"region": "Japan", "state": "Tokyo", "lat": 35.6762, "lon": 139.6503},
    "ko": {"region": "South Korea", "state": "Seoul", "lat": 37.5665, "lon": 126.9780},
    "ar": {"region": "Egypt", "state": "Cairo", "lat": 30.0444, "lon": 31.2357},
    "tr": {"region": "Turkey", "state": "Istanbul", "lat": 41.0082, "lon": 28.9784},
    "nl": {"region": "Netherlands", "state": "Amsterdam", "lat": 52.3676, "lon": 4.9041},
    "se": {"region": "Sweden", "state": "Stockholm", "lat": 59.3293, "lon": 18.0686},
    "no": {"region": "Norway", "state": "Oslo", "lat": 59.9139, "lon": 10.7522},
    "dk": {"region": "Denmark", "state": "Copenhagen", "lat": 55.6761, "lon": 12.5683},
    "fi": {"region": "Finland", "state": "Helsinki", "lat": 60.1699, "lon": 24.9384},
    "pl": {"region": "Poland", "state": "Warsaw", "lat": 52.2297, "lon": 21.0122},
    "ua": {"region": "Ukraine", "state": "Kyiv", "lat": 50.4501, "lon": 30.5234},
    "gr": {"region": "Greece", "state": "Athens", "lat": 37.9838, "lon": 23.7275},
    "th": {"region": "Thailand", "state": "Bangkok", "lat": 13.7563, "lon": 100.5018},
    "id": {"region": "Indonesia", "state": "Jakarta", "lat": -6.2088, "lon": 106.8456},
    "ph": {"region": "Philippines", "state": "Manila", "lat": 14.5995, "lon": 120.9842},
    "vn": {"region": "Vietnam", "state": "Hanoi", "lat": 21.0285, "lon": 105.8542},
    "my": {"region": "Malaysia", "state": "Kuala Lumpur", "lat": 3.1390, "lon": 101.6869},
    "sg": {"region": "Singapore", "state": "Singapore", "lat": 1.3521, "lon": 103.8198},
    "au": {"region": "Australia", "state": "Sydney", "lat": -33.8688, "lon": 151.2093},
    "nz": {"region": "New Zealand", "state": "Wellington", "lat": -41.2865, "lon": 174.7762},
    "ca": {"region": "Canada", "state": "Toronto", "lat": 43.651070, "lon": -79.347015},
    "br": {"region": "Brazil", "state": "São Paulo", "lat": -23.5505, "lon": -46.6333},
    "mx": {"region": "Mexico", "state": "Mexico City", "lat": 19.4326, "lon": -99.1332},
    "za": {"region": "South Africa", "state": "Johannesburg", "lat": -26.2041, "lon": 28.0473},

    # -------- INDIA (ALL STATES) --------
    "hi": {"region": "India", "state": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "kn": {"region": "India", "state": "Karnataka", "lat": 15.3173, "lon": 75.7139},
    "ta": {"region": "India", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    "te": {"region": "India", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    "ml": {"region": "India", "state": "Kerala", "lat": 10.8505, "lon": 76.2711},
    "mr": {"region": "India", "state": "Maharashtra", "lat": 19.7515, "lon": 75.7139},
    "gu": {"region": "India", "state": "Gujarat", "lat": 22.2587, "lon": 71.1924},
    "pa": {"region": "India", "state": "Punjab", "lat": 31.1471, "lon": 75.3412},
    "as": {"region": "India", "state": "Assam", "lat": 26.2006, "lon": 92.9376},
    "wb": {"region": "India", "state": "West Bengal", "lat": 22.9868, "lon": 87.8550},
    "or": {"region": "India", "state": "Odisha", "lat": 20.9517, "lon": 85.0985},
    "up": {"region": "India", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    "mp": {"region": "India", "state": "Madhya Pradesh", "lat": 23.4733, "lon": 77.9470},
    "rj": {"region": "India", "state": "Rajasthan", "lat": 27.0238, "lon": 74.2179},
    "jk": {"region": "India", "state": "Jammu & Kashmir", "lat": 33.7782, "lon": 76.5762},
    "hp": {"region": "India", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734},
    "uk": {"region": "India", "state": "Uttarakhand", "lat": 30.0668, "lon": 79.0193},
    "br_in": {"region": "India", "state": "Bihar", "lat": 25.0961, "lon": 85.3131},
    "jh": {"region": "India", "state": "Jharkhand", "lat": 23.6102, "lon": 85.2799},
    "ch": {"region": "India", "state": "Chhattisgarh", "lat": 21.2787, "lon": 81.8661},
    "ga": {"region": "India", "state": "Goa", "lat": 15.2993, "lon": 74.1240},
    "sk": {"region": "India", "state": "Sikkim", "lat": 27.5330, "lon": 88.5122},
    "mz": {"region": "India", "state": "Mizoram", "lat": 23.1645, "lon": 92.9376},
    "nl_in": {"region": "India", "state": "Nagaland", "lat": 26.1584, "lon": 94.5624},
    "mn": {"region": "India", "state": "Manipur", "lat": 24.6637, "lon": 93.9063},
    "tr_in": {"region": "India", "state": "Tripura", "lat": 23.9408, "lon": 91.9882},
    "me": {"region": "India", "state": "Meghalaya", "lat": 25.4670, "lon": 91.3662},
    "ar_in": {"region": "India", "state": "Arunachal Pradesh", "lat": 28.2180, "lon": 94.7278},
}


async def detect_region(movie_data: dict) -> dict:
    """
    Ask Ollama to identify the production country of the movie.
    Falls back to the language→country map if Ollama gives nothing useful.
    Returns a dict with keys: region, state, lat, lon.
    """
    short_ov = movie_data["overview"][:150].rsplit(" ", 1)[0]
    lang     = movie_data.get("language", "")

    prompt = (
        f'You are a film database expert. '
        f'Movie title: "{movie_data["title"]}". '
        f'Original language: {lang}. '
        f'Brief overview: {short_ov}. '
        f'Identify the PRODUCTION country where this film was made (not the fictional story setting). '
        f'A Hollywood sci-fi set in space is still "United States". A Bollywood film is "India". '
        f'Reply with ONLY a raw JSON object, no explanation, no markdown, no code fences: '
        f'{{"region":"United States","state":"California","lat":34.0522,"lon":-118.2437}}'
    )

    raw    = await ollama_generate(prompt, timeout=120)
    parsed = extract_json_robust(raw) if raw else {}
    region = parsed.get("region", "")

    # Fallback to language map if Ollama gave nothing useful
    if not region or region.strip().lower() in ("unknown", ""):
        if lang in LANGUAGE_TO_COUNTRY:
            return LANGUAGE_TO_COUNTRY[lang]
        return {"region": "Unknown", "state": "", "lat": 20.0, "lon": 78.0}

    return {
        "region": parsed.get("region", "Unknown"),
        "state":  parsed.get("state", ""),
        "lat":    float(parsed.get("lat", 0.0)),
        "lon":    float(parsed.get("lon", 0.0)),
    }