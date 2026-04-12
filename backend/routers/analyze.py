from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from db.connection import get_db
from db.models import (
    AnalyzeRequest, CompareRequest, CompareResponse,
    AlignmentDocument, ComparisonEntry,
    MovieInfo, RegionInfo, AnalysisResult,
    ContentFlags, SimilarMovie,
)
from modules.tmdb   import fetch_movie
from modules.region import detect_region
from modules.scorer import get_cultural_score, get_multi_cultural_scores

router = APIRouter(prefix="/api", tags=["analyze"])


# ── Cache lookup ──────────────────────────────────────────────────
async def _get_cached(title: str, target_region: str) -> dict | None:
    db  = get_db()
    doc = await db.alignments.find_one({
        "movie.title":   {"$regex": f"^{title}$", "$options": "i"},
        "target_region": target_region,
    })
    return doc


# ── Build AlignmentDocument ───────────────────────────────────────
def _build_doc(
    movie_data: dict, origin: dict, target_region: str, score_data: dict
) -> AlignmentDocument:
    flags_raw   = score_data.get("content_flags", {})
    similar_raw = score_data.get("similar_movies", [])

    safe_flags = {
        "violence":             flags_raw.get("violence",             "None"),
        "adult_content":        flags_raw.get("adult_content",        "None"),
        "religion_sensitivity": flags_raw.get("religion_sensitivity", "None"),
        "drug_glorification":   flags_raw.get("drug_glorification",   "None"),
    }

    return AlignmentDocument(
        searched_at=datetime.utcnow(),
        movie=MovieInfo(**movie_data),
        origin_region=RegionInfo(
            region=origin.get("region", "Unknown"),
            state=origin.get("state",  ""),
            lat=float(origin.get("lat",  0.0)),
            lon=float(origin.get("lon",  0.0)),
        ),
        target_region=target_region,
        result=AnalysisResult(
            score=score_data.get("score"),
            label=score_data.get("label", ""),
            reason=score_data.get("reason", ""),
            content_flags=ContentFlags(**safe_flags),
            audience_note=score_data.get("audience_note", ""),
            similar_movies=[
                SimilarMovie(**sm) for sm in similar_raw[:3]
                if isinstance(sm, dict) and "title" in sm and "reason" in sm
            ],
        )
    )


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze — single movie + single target region
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Accepts movie_input as: plain title, TMDB URL, or IMDB URL.
    Scores the movie for target_region.
    Checks MongoDB cache first — skips Ollama if already computed.
    """

    # Step 1: Fetch movie (handles title/TMDB link/IMDB link)
    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(
            status_code=404,
            detail=f"Movie not found: '{request.movie_input}'. "
                   f"Try a different title, or paste a TMDB/IMDB link."
        )

    # Step 2: Cache check
    cached_doc = await _get_cached(movie_data["title"], request.target_region)
    if cached_doc:
        cached_doc["id"] = str(cached_doc.pop("_id"))
        if isinstance(cached_doc.get("searched_at"), datetime):
            cached_doc["searched_at"] = cached_doc["searched_at"].isoformat()
        return {**cached_doc, "cached": True}

    # Step 3: Detect origin
    origin = await detect_region(movie_data)

    # Step 4: Score for target region
    score_data = await get_cultural_score(movie_data, target_region=request.target_region)
    if not score_data:
        raise HTTPException(
            status_code=500,
            detail="Scoring failed or timed out. Is Ollama running? Run: ollama serve"
        )

    # Step 5: Save + return
    doc    = _build_doc(movie_data, origin, request.target_region, score_data)
    db     = get_db()
    result = await db.alignments.insert_one(doc.model_dump())

    return {
        "id":            str(result.inserted_id),
        "searched_at":   doc.searched_at.isoformat(),
        "movie":         doc.movie.model_dump(),
        "origin_region": doc.origin_region.model_dump(),
        "target_region": doc.target_region,
        "result":        doc.result.model_dump(),
        "cached":        False,
    }


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze/compare — multi-country comparison
# Single Ollama call for ALL countries (much faster than N calls)
# target_region is excluded from the comparison automatically
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze/compare", response_model=CompareResponse)
async def compare(request: CompareRequest):
    """
    Compare a movie across multiple countries.

    KEY IMPROVEMENTS over old /multi endpoint:
    1. Uses ONE Ollama call for all countries (not N separate calls)
    2. Each result includes a reasoning sentence
    3. Already-cached combos are pulled from MongoDB (skipped in Ollama call)
    4. Sorted by score descending in response
    """

    # Fetch movie
    movie_data = await fetch_movie(request.movie_input)
    if not movie_data:
        raise HTTPException(
            status_code=404,
            detail=f"Movie not found: '{request.movie_input}'."
        )

    title   = movie_data["title"]
    regions = list(dict.fromkeys(request.regions))  # deduplicate, preserve order

    # ── Separate cached vs uncached regions ──
    cached_entries:   list[ComparisonEntry] = []
    uncached_regions: list[str]             = []

    for region in regions:
        doc = await _get_cached(title, region)
        if doc:
            r = doc.get("result", {})
            cached_entries.append(ComparisonEntry(
                region=region,
                score=r.get("score"),
                label=r.get("label", ""),
                reason=r.get("reason", "")[:120],   # truncate long reasons for comparison view
                cached=True,
            ))
        else:
            uncached_regions.append(region)

    # ── Single Ollama call for all uncached regions ──
    fresh_entries: list[ComparisonEntry] = []
    if uncached_regions:
        raw_scores = await get_multi_cultural_scores(movie_data, uncached_regions)

        # Detect origin once (for saving to DB)
        origin = await detect_region(movie_data)

        for entry in raw_scores:
            region = entry.get("region", "")
            if not region:
                continue

            score_data_for_db = {
                "score":          entry.get("score"),
                "label":          entry.get("label", ""),
                "reason":         entry.get("reason", ""),
                "content_flags":  {},
                "audience_note":  "",
                "similar_movies": [],
            }

            # Save to MongoDB for future cache hits
            doc_to_save = _build_doc(movie_data, origin, region, score_data_for_db)
            db = get_db()
            await db.alignments.insert_one(doc_to_save.model_dump())

            fresh_entries.append(ComparisonEntry(
                region=region,
                score=entry.get("score"),
                label=entry.get("label", ""),
                reason=entry.get("reason", ""),
                cached=False,
            ))

    # ── Combine and sort ──
    all_entries = cached_entries + fresh_entries
    all_entries.sort(key=lambda e: (e.score or 0), reverse=True)

    return CompareResponse(
        movie=MovieInfo(**movie_data),
        entries=all_entries,
    )