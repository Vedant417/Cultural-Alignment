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
  violence:             string;
  adult_content:        string;
  religion_sensitivity: string;
  drug_glorification:   string;
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
  id:            string;
  searched_at:   string;
  movie:         MovieInfo;
  origin_region: RegionInfo;
  target_region: string;
  result:        AnalysisResult;
  cached?:       boolean;
}

// ── New comparison types ──
export interface ComparisonEntry {
  region:  string;
  score:   number | null;
  label:   string;
  reason:  string;
  cached:  boolean;
}

export interface CompareResponse {
  movie:   MovieInfo;
  entries: ComparisonEntry[];
}

export interface CountryOption {
  name:  string;
  flag:  string;
  group: string;
}