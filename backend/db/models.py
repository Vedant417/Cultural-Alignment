from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MovieInfo(BaseModel):
    title:        str
    overview:     str
    release_date: str
    language:     str
    poster_url:   Optional[str] = ""
    genres:       Optional[List[dict]] = []
    popularity:   Optional[float] = 0
    tmdb_id:      Optional[int] = None
    imdb_id:      Optional[str] = None


class RegionInfo(BaseModel):
    region: str
    state:  str
    lat:    float
    lon:    float


class ContentFlags(BaseModel):
    violence:             str = "None"
    adult_content:        str = "None"
    religion_sensitivity: str = "None"
    drug_glorification:   str = "None"


class SimilarMovie(BaseModel):
    title:  str
    reason: str
    poster_url: Optional[str] = ""
    release_date: Optional[str] = ""
    tmdb_id: Optional[int] = None


class AnalysisResult(BaseModel):
    score:          Optional[int] = None
    label:          str = ""
    reason:         str = ""
    content_flags:  ContentFlags = Field(default_factory=ContentFlags)
    audience_note:  str = ""
    similar_movies: List[SimilarMovie] = []
    recommendations: Optional[List[dict]] = []
    genres: Optional[List[dict]] = []


class DeepAnalysisSections(BaseModel):
    language_dialogue:  Optional[str] = None
    religion_values:    Optional[str] = None
    censorship_risk:    Optional[str] = None
    audience_breakdown: Optional[str] = None
    historical_context: Optional[str] = None


class DeepAnalysisCache(BaseModel):
    """Cached deep analysis for a movie+region combo"""
    sections:      DeepAnalysisSections
    generated_at:  datetime = Field(default_factory=datetime.utcnow)


class AlignmentDocument(BaseModel):
    searched_at:   datetime = Field(default_factory=datetime.utcnow)
    movie:         MovieInfo
    origin_region: RegionInfo
    target_region: str
    result:        AnalysisResult
    deep_analysis: Optional[DeepAnalysisCache] = None  # ✅ NEW: cached deep analysis
    favorited:     Optional[bool] = None  # ✅ NEW: favorites flag
    favorited_at:  Optional[datetime] = None  # ✅ NEW: when favorited


# ── New: comparison entry (used by /analyze/compare) ──
class ComparisonEntry(BaseModel):
    """One country's score in a multi-country comparison."""
    region:  str
    score:   Optional[int]
    label:   str
    reason:  str                   # AI reasoning sentence for this country
    cached:  bool = False


class CompareRequest(BaseModel):
    movie_input:   str             # title, TMDB link, or IMDB link
    regions:       List[str]       # countries to compare (target country excluded)


class CompareResponse(BaseModel):
    movie:   MovieInfo
    entries: List[ComparisonEntry]  # sorted by score descending


# ── Single analyze ──
class AnalyzeRequest(BaseModel):
    movie_input:   str             # title, TMDB link, or IMDB link
    target_region: str = "India"


# ── Multi (old — kept for backward compat) ──
class MultiAnalyzeRequest(BaseModel):
    movie_name: str
    regions:    List[str]


class RegionScore(BaseModel):
    region:  str
    score:   Optional[int]
    label:   str
    cached:  bool = False


class MultiAnalyzeResponse(BaseModel):
    movie:   MovieInfo
    scores:  List[RegionScore]