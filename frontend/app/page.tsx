"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter }    from "next/navigation";
import { analyzeMovie }                  from "@/lib/api";
import { getCachedAnalysis }             from "@/lib/api";
import { AlignmentDocument }             from "@/types";
import CountrySelector                   from "@/components/CountrySelector";
import MovieDetailsCard                  from "@/components/MovieDetailsCard";
import ScoreBadge                        from "@/components/ScoreBadge";
import ContentFlags                      from "@/components/ContentFlags";
import SimilarMovies                     from "@/components/SimilarMovies";

// ── Helpers ───────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   "#111827",
      border:       "1px solid #1e2438",
      borderRadius: "18px",
      overflow:     "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{
        width: "40px", height: "40px",
        border: "3px solid #1e2438", borderTopColor: "#6366f1",
        borderRadius: "50%", margin: "0 auto 20px",
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#c8d3ea", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
        {message}
      </p>
      <p style={{ color: "#4b5a73", fontSize: "13px" }}>
        Cached results load instantly. First-time analysis takes 1–3 min.
      </p>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#160a0a", border: "1px solid #5b1d1d", borderRadius: "14px",
      padding: "18px 22px", display: "flex", gap: "12px", alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "20px" }}>❌</span>
      <div>
        <p style={{ fontWeight: 700, color: "#fca5a5", marginBottom: "5px", fontSize: "15px" }}>
          Error
        </p>
        <p style={{ color: "#f87171", fontSize: "14px", lineHeight: 1.55 }}>{message}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily:    "Sora, sans-serif",
      fontWeight:    700,
      fontSize:      "17px",
      color:         "#f0f4ff",
      marginBottom:  "14px",
      letterSpacing: "-0.01em",
    }}>
      {children}
    </h2>
  );
}

// ── Main content — reads URL params ──────────────────────────────
function AnalyzeContent() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const [movieInput,   setMovieInput]   = useState("");
  const [targetCountry,setTargetCountry]= useState("India");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [result,       setResult]       = useState<AlignmentDocument | null>(null);

  // Pre-load from history redirect: ?movie=Inception&region=India
  useEffect(() => {
    const movieParam  = searchParams.get("movie");
    const regionParam = searchParams.get("region");
    if (movieParam && regionParam) {
      setMovieInput(movieParam);
      setTargetCountry(regionParam);
      setLoading(true);
      setError(null);
      setResult(null);
      getCachedAnalysis(movieParam, regionParam)
        .then((data) => setResult(data))
        .catch(() => {
          // Cache miss — run fresh analysis
          analyzeMovie(movieParam, regionParam)
            .then((data) => setResult(data))
            .catch((e: unknown) =>
              setError(e instanceof Error ? e.message : "Failed to load analysis.")
            );
        })
        .finally(() => setLoading(false));
      // Clean URL params after loading
      router.replace("/", { scroll: false });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!movieInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeMovie(movieInput.trim(), targetCountry);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputIsLink =
    movieInput.includes("themoviedb") || movieInput.includes("imdb");

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{
          fontFamily:    "Sora, sans-serif",
          fontWeight:    800,
          fontSize:      "34px",
          color:         "#f0f4ff",
          marginBottom:  "8px",
          letterSpacing: "-0.025em",
          lineHeight:    1.15,
        }}>
          🎬 AI Cultural Alignment
        </h1>
        <p style={{ color: "#4b5a73", fontSize: "15px", marginBottom: "28px", lineHeight: 1.6 }}>
          Discover how well any movie fits a country's culture.
          Supports plain titles, TMDB links, and IMDB links.
        </p>

        {/* ── Input row ── */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>

          {/* Movie input */}
          <div style={{ flex: "1 1 300px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5a73",
                            display: "block", marginBottom: "7px", textTransform: "uppercase",
                            letterSpacing: "0.08em" }}>
              Movie — title or link
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={movieInput}
                onChange={(e) => setMovieInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                placeholder='e.g. "Inception"  or  paste TMDB / IMDB link'
                disabled={loading}
                style={{
                  width:        "100%",
                  background:   "#111827",
                  border:       "1.5px solid #1e2438",
                  borderRadius: "12px",
                  padding:      "13px 16px",
                  color:        "#f0f4ff",
                  fontSize:     "15px",
                  outline:      "none",
                  boxSizing:    "border-box",
                  transition:   "border-color 0.15s",
                  opacity:      loading ? 0.6 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e)  => (e.target.style.borderColor = "#1e2438")}
              />
              {inputIsLink && (
                <span style={{
                  position:  "absolute",
                  right:     "12px",
                  top:       "50%",
                  transform: "translateY(-50%)",
                  fontSize:  "11px",
                  color:     "#6366f1",
                  fontWeight: 600,
                  background: "rgba(99,102,241,0.12)",
                  padding:   "2px 7px",
                  borderRadius: "6px",
                }}>
                  ✓ link
                </span>
              )}
            </div>
          </div>

          {/* Country dropdown */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5a73",
                            display: "block", marginBottom: "7px", textTransform: "uppercase",
                            letterSpacing: "0.08em" }}>
              Target Country
            </label>
            <CountrySelector
              selected={targetCountry}
              onChange={setTargetCountry}
              disabled={loading}
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !movieInput.trim()}
            style={{
              background:   loading ? "#312e81" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              color:        "#fff",
              border:       "none",
              borderRadius: "12px",
              padding:      "13px 26px",
              fontWeight:   700,
              fontSize:     "15px",
              cursor:       loading || !movieInput.trim() ? "not-allowed" : "pointer",
              opacity:      !movieInput.trim() ? 0.45 : 1,
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              whiteSpace:   "nowrap",
              boxShadow:    loading ? "none" : "0 4px 18px rgba(99,102,241,0.35)",
              transition:   "all 0.15s",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "15px", height: "15px",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.75s linear infinite",
                }} />
                Analyzing…
              </>
            ) : "🔍 Analyze"}
          </button>
        </div>

        {/* Hint pills */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          {[
            { icon: "📝", text: "Title: \"KGF Chapter 2\"" },
            { icon: "🔗", text: "themoviedb.org/movie/12345" },
            { icon: "🎬", text: "imdb.com/title/tt1375666" },
            { icon: "📱", text: "m.imdb.com/title/tt1375666" },
          ].map(({ icon, text }) => (
            <span key={text} style={{
              fontSize:     "12px",
              color:        "#4b5a73",
              background:   "#0f1420",
              border:       "1px solid #1e2438",
              borderRadius: "7px",
              padding:      "4px 10px",
              display:      "flex",
              alignItems:   "center",
              gap:          "5px",
            }}>
              {icon} {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── RESULTS ──────────────────────────────────────────── */}
      {loading && (
        <LoadingCard message={`Analyzing "${movieInput}" for ${targetCountry}…`} />
      )}
      {error && !loading && <ErrorCard message={error} />}

      {result && !loading && (
        <div style={{ animation: "fadeUp 0.45s ease both" }}>
          <style>{`
            @keyframes fadeUp {
              from { opacity:0; transform:translateY(16px); }
              to   { opacity:1; transform:translateY(0); }
            }
          `}</style>

          {result.cached && (
            <div style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "7px",
              background:   "rgba(99,102,241,0.12)",
              border:       "1px solid rgba(99,102,241,0.25)",
              borderRadius: "9px",
              padding:      "5px 13px",
              marginBottom: "18px",
              fontSize:     "13px",
              color:        "#818cf8",
              fontWeight:   600,
            }}>
              ⚡ Loaded instantly from cache
            </div>
          )}

          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap:                 "24px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionLabel>🎞️ Movie Details</SectionLabel>
              <MovieDetailsCard
                movie={result.movie}
                originRegion={result.origin_region?.region ?? "Unknown"}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionLabel>🎯 Cultural Fit — {result.target_region}</SectionLabel>
              <ScoreBadge
                result={result.result}
                targetRegion={result.target_region}
                cached={result.cached}
              />
              <ContentFlags flags={result.result.content_flags} />
              <SimilarMovies movies={result.result.similar_movies} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ color: "#4b5a73", padding: "40px" }}>Loading…</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}