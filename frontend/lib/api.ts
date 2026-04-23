import { AlignmentDocument, CompareResponse, GroupedHistory } from "@/types";

export interface MovieCompareEntry {
  movie:         { title: string; overview: string; release_date: string; language: string; poster_url?: string };
  origin_region: { region: string; state: string; lat: number; lon: number };
  score:         number | null;
  label:         string;
  reason:        string;
  audience_note: string;
  content_flags: { violence: string; adult_content: string; religion_sensitivity: string; drug_glorification: string };
  winner:        boolean;
}

export interface TwoMovieCompareResponse {
  target_region: string;
  movie_a:       MovieCompareEntry;
  movie_b:       MovieCompareEntry;
}

export interface DeepAnalysisSections {
  language_dialogue:  string;
  religion_values:    string;
  censorship_risk:    string;
  audience_breakdown: string;
  historical_context: string;
}

export interface DeepAnalysisResponse {
  movie_title:   string;
  target_region: string;
  score:         number;
  label:         string;
  sections:      DeepAnalysisSections;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Single analyze — accepts title, TMDB link, or IMDB link ──────
export async function analyzeMovie(
  movieInput:   string,
  targetRegion: string
): Promise<AlignmentDocument> {
  const res = await fetch(`${BASE}/api/analyze`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ movie_input: movieInput, target_region: targetRegion }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Analysis failed");
  }
  return res.json();
}

// ── Multi-country comparison ─────────────────────────────────────
export async function compareMovieAcrossRegions(
  movieInput: string,
  regions:    string[]
): Promise<CompareResponse> {
  const res = await fetch(`${BASE}/api/analyze/multi-country`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ movie_input: movieInput, target_regions: regions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Comparison failed");
  }
  return res.json();
}

// ── Multi-country analysis (1 movie, multiple countries) ─────────
export async function analyzeMovieMultiCountry(
  movieInput: string,
  regions:    string[]
): Promise<any> {
  const res = await fetch(`${BASE}/api/analyze/multi-country`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ movie_input: movieInput, target_regions: regions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Multi-country analysis failed");
  }
  return res.json();
}

// ── Movie-vs-Movie comparison (2 movies, 1 country) ────────────────
export async function compareTwoMovies(
  movieA:       string,
  movieB:       string,
  targetRegion: string
): Promise<TwoMovieCompareResponse> {
  const cleanA = movieA.trim().replace(/\s+/g, " ");
  const cleanB = movieB.trim().replace(/\s+/g, " ");

  if (!cleanA || !cleanB) {
    throw new Error("Both Movie A and Movie B are required.");
  }
  if (!targetRegion) {
    throw new Error("Target region is required.");
  }

  const res = await fetch(`${BASE}/api/compare/two-movies`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movie_input_a: cleanA,
      movie_input_b: cleanB,
      target_region: targetRegion,
    }),
  });

  if (!res.ok) {
    let detail = "Comparison failed";
    try {
      const err = await res.json();
      detail = (err as { detail?: string }).detail ?? detail;
    } catch { /* ignore parse error */ }
    throw new Error(detail);
  }

  return res.json() as Promise<TwoMovieCompareResponse>;
}

// ── Check if comparison is cached from MongoDB ─────────────────────
export async function checkTwoMoviesCached(
  movieA:       string,
  movieB:       string,
  targetRegion: string
): Promise<{ cached: boolean; data?: TwoMovieCompareResponse }> {
  try {
    const cleanA = movieA.trim().replace(/\s+/g, " ");
    const cleanB = movieB.trim().replace(/\s+/g, " ");
    
    const res = await fetch(`${BASE}/api/compare/check-cached`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movie_input_a: cleanA,
        movie_input_b: cleanB,
        target_region: targetRegion,
      }),
    });

    if (!res.ok) {
      return { cached: false };
    }

    const data = await res.json();
    return { cached: true, data };
  } catch {
    return { cached: false };
  }
}

export async function fetchDeepAnalysis(
  movieTitle:   string,
  targetRegion: string,
  score:        number,
  label:        string,
  briefReason:  string
): Promise<DeepAnalysisResponse> {
  const res = await fetch(`${BASE}/api/analyze/deep`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movie_title:   movieTitle,
      target_region: targetRegion,
      score,
      label,
      brief_reason:  briefReason,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Deep analysis failed");
  }
  return res.json();
}

// ── History ──────────────────────────────────────────────────────
export async function getHistory(): Promise<AlignmentDocument[]> {
  const res = await fetch(`${BASE}/api/history`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  await fetch(`${BASE}/api/history/${id}`, { method: "DELETE" });
}




// Grouped history — one entry per movie
export async function getGroupedHistory() {
  const res = await fetch(`${BASE}/api/history/grouped/all`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }

  return res.json();
}

// Fetch a specific cached analysis for pre-loading on analyze page
export async function getCachedAnalysis(
  title: string,
  region: string
): Promise<AlignmentDocument> {
  const params = new URLSearchParams({ title, region });
  const res = await fetch(`${BASE}/api/history/cached?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Cached analysis not found");
  return res.json();
}

// ── Favorites ────────────────────────────────────────────────────
export async function saveFavorite(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/favorites/${id}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to save favorite");
}

export async function removeFavorite(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/favorites/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove favorite");
}

export async function getFavorites(): Promise<AlignmentDocument[]> {
  const res = await fetch(`${BASE}/api/favorites`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

// ── Genre Movies ─────────────────────────────────────────────────
export async function getMoviesByGenre(
  genreName: string,
  limit: number = 20
): Promise<{genre: string; count: number; movies: Array<{title: string; poster_url: string; release_date: string; tmdb_id?: number}>; message?: string}> {
  const params = new URLSearchParams({ genre_name: genreName, limit: limit.toString() });
  const res = await fetch(`${BASE}/api/analyze/genre-movies?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch movies for genre: ${genreName}`);
  return res.json();
}