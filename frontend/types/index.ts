export interface MovieInfo {
  title:        string;
  overview:     string;
  release_date: string;
  language:     string;
  poster_url?:  string;
}

export interface RegionInfo {
  region: string;
  state:  string;
  lat:    number;
  lon:    number;
}

export interface ContentFlags {
  violence:             "None" | "Mild" | "Moderate" | "High";
  adult_content:        "None" | "Mild" | "Moderate" | "High";
  religion_sensitivity: "None" | "Low"  | "Moderate" | "High";
  drug_glorification:   "None" | "Mild" | "Moderate" | "High";
}

export interface SimilarMovie {
  title:  string;
  reason: string;
}

export interface AnalysisResult {
  score:          number | null;
  label:          string;
  reason:         string;
  content_flags:  ContentFlags;
  audience_note:  string;
  similar_movies: SimilarMovie[];
}

export interface AlignmentDocument {
  id:          string;
  searched_at: string;
  movie:       MovieInfo;
  region:      RegionInfo;
  result:      AnalysisResult;
}