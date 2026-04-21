export interface MovieInfo {
  title:        string;
  overview:     string;
  release_date: string;
  language:     string;
  poster_url?:  string;
  genres?:      Array<{id: number; name: string}>;
  popularity?:  number;
  tmdb_id?:     number;
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
  title:        string;
  reason:       string;
  poster_url?:  string;
  release_date?: string;
  tmdb_id?:     number;
}

export interface AnalysisResult {
  score:          number | null;
  label:          string;
  reason:         string;
  content_flags:  ContentFlags;
  audience_note:  string;
  similar_movies: SimilarMovie[];
  sub_scores?:    SubScores;
  recommendations?: Array<{title: string; poster_url: string; release_date: string; tmdb_id?: number}>;
  genres?: Array<{id: number; name: string}>;
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

export interface SubScores {
  cultural_fit: number;
  censorship_risk: number;
  language_fit: number;
  market_appeal: number;
}

export interface ComparisonEntry {
  region: string;
  score: number | null;
  label: string;
  reason?: string;
  cached?: boolean;
  sub_scores?: SubScores;
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

export interface HistoryEntry {
  id:            string;
  target_region: string;
  score:         number | null;
  label:         string;
  reason:        string;
  searched_at:   string;
}

export interface GroupedHistory {
  title:        string;
  poster_url:   string;
  language:     string;
  release_date: string;
  latest_date:  string;
  entries:      HistoryEntry[];
}



export interface MovieVsMovieResult {
  region:  string;
  movie_a: { title: string; score: number; label: string; reason: string };
  movie_b: { title: string; score: number; label: string; reason: string };
}

export interface Recommendation {
  title:          string;
  reason:         string;
  expected_score: number;
}

export interface DeepAnalysis {
  language:   string;
  religion:   string;
  censorship: string;
  audience:   string;
  context:    string;
}

export type Lang = "en" | "hi" | "es" | "ja";