import { useState } from "react";
import { analyzeMovie } from "@/lib/api";
import { AlignmentDocument } from "@/types";
import SearchBar       from "@/components/SearchBar";
import MovieDetailsCard from "@/components/MovieDetailsCard";
import LocationCard    from "@/components/LocationCard";
import ScoreBadge      from "@/components/ScoreBadge";
import ContentFlags    from "@/components/ContentFlags";
import SimilarMovies   from "@/components/SimilarMovies";
import { AlertCircle, Clock } from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [result,  setResult]  = useState<AlignmentDocument | null>(null);

  const handleAnalyze = async (movie: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeMovie(movie);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1
          className="font-extrabold text-4xl text-slate-100 mb-2 tracking-tight"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          🎬 AI Cultural Alignment
        </h1>
        <p className="text-slate-500 text-base mb-8">
          Analyze how well a movie fits the culture of its region of origin — powered by Ollama + TMDB.
        </p>
        <SearchBar onAnalyze={handleAnalyze} loading={loading} />
      </div>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl p-10 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-slate-300 text-sm font-medium">Analyzing cultural alignment…</p>
            <p className="text-slate-600 text-xs mt-1">This may take 1–3 minutes on a local CPU model.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5" />
            Step 1: Fetching movie → Step 2: Detecting region → Step 3: Scoring cultural fit
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-950/30 border border-red-900 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300 text-sm">Analysis Failed</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────── */}
      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Movie + Location */}
          <div className="space-y-5">
            <SectionTitle>🎞️ Movie Details</SectionTitle>
            <MovieDetailsCard movie={result.movie} />
            <LocationCard     region={result.region} />
          </div>
          {/* Right: Score + Flags + Similar */}
          <div className="space-y-5">
            <SectionTitle>🎯 Cultural Analysis</SectionTitle>
            <ScoreBadge    result={result.result} region={result.region.region} />
            <ContentFlags  flags={result.result.content_flags} />
            <SimilarMovies movies={result.result.similar_movies} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold text-lg text-slate-200"
      style={{ fontFamily: "var(--font-sora), sans-serif" }}
    >
      {children}
    </h2>
  );
}