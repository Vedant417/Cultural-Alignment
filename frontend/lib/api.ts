import { AlignmentDocument, CompareResponse, GroupedHistory } from "@/types";


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
  const res = await fetch(`${BASE}/api/analyze/compare`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ movie_input: movieInput, regions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Comparison failed");
  }
  return res.json();
}

// ── Movie-vs-Movie comparison (2 movies, 1 country) ────────────────
export async function compareTwoMovies(
  movieA:  string,
  movieB:  string,
  region:  string
): Promise<any> {
  const res = await fetch(`${BASE}/api/compare/movie-vs-movie`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      movie_a: movieA.trim(),
      movie_b: movieB.trim(),
      region,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Comparison failed." }));
    throw new Error((err as { detail?: string }).detail ?? "Movie-vs-movie comparison failed.");
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
  const res = await fetch("http://localhost:8000/api/history/grouped/all", {
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