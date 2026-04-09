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
    Shape of a document stored in MongoDB collection `alignments`.
    {
      "_id": ObjectId,
      "searched_at": ISODate,
      "movie": { title, overview, release_date, language, poster_url },
      "region": { region, state, lat, lon },
      "result": { score, label, reason, content_flags, audience_note, similar_movies }
    }
    """
    searched_at: datetime = Field(default_factory=datetime.utcnow)
    movie:       MovieInfo
    region:      RegionInfo
    result:      AnalysisResult


# ---- API request/response ----

class AnalyzeRequest(BaseModel):
    movie_name: str


class AnalyzeResponse(AlignmentDocument):
    id: str  # Stringified MongoDB ObjectId