from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ---- Sub-models ----

class MovieInfo(BaseModel):
    title:        str
    overview:     str
    release_date: str
    language:     str
    poster_url:   Optional[str] = ""


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


class AnalysisResult(BaseModel):
    score:          Optional[int] = None
    label:          str = ""
    reason:         str = ""
    content_flags:  ContentFlags = Field(default_factory=ContentFlags)
    audience_note:  str = ""
    similar_movies: List[SimilarMovie] = []


# ---- Top-level MongoDB document ----

class AlignmentDocument(BaseModel):
    """
    MongoDB document in `alignments` collection.
    target_region = the country the user CHOSE to score for (may differ from production country).
    """
    searched_at:   datetime = Field(default_factory=datetime.utcnow)
    movie:         MovieInfo
    origin_region: RegionInfo           # production country (auto-detected)
    target_region: str                  # user-chosen country for scoring
    result:        AnalysisResult


# ---- API Requests ----

class AnalyzeRequest(BaseModel):
    movie_name:    str
    target_region: str = "India"        # which country the user wants to score for


class MultiAnalyzeRequest(BaseModel):
    """For pie chart — score one movie against multiple countries at once."""
    movie_name: str
    regions:    List[str]               # e.g. ["India", "France", "Japan", "United States"]


# ---- API Responses ----

class AnalyzeResponse(BaseModel):
    id:            str
    searched_at:   str
    movie:         MovieInfo
    origin_region: RegionInfo
    target_region: str
    result:        AnalysisResult
    cached:        bool = False         # True if result came from MongoDB cache


class RegionScore(BaseModel):
    """Single entry in a multi-country comparison."""
    region:  str
    score:   Optional[int]
    label:   str
    cached:  bool = False


class MultiAnalyzeResponse(BaseModel):
    movie:   MovieInfo
    scores:  List[RegionScore]        