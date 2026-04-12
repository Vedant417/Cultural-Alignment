"use client";
import { useState }                        from "react";
import { analyzeMovie, compareMovieAcrossRegions } from "@/lib/api";
import { AlignmentDocument, CompareResponse } from "@/types";
import CountrySelector, { COUNTRIES }      from "@/components/CountrySelector";
import ComparisonCards                     from "@/components/ComparisonCards";
import MovieDetailsCard                    from "@/components/MovieDetailsCard";
import ScoreBadge                          from "@/components/ScoreBadge";
import ContentFlags                        from "@/components/ContentFlags";
import SimilarMovies                       from "@/components/SimilarMovies";

// ── Shared UI helpers ─────────────────────────────────────────────
function LoadingCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#141824", border: "1px solid #252d45", borderRadius: "16px",
      padding: "48px 24px", textAlign: "center",
    }}>
      <div style={{
        width: "36px", height: "36px",
        border: "3px solid #252d45", borderTopColor: "#6366f1",
        borderRadius: "50%", margin: "0 auto 18px",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#c8d3ea", fontSize: "14px", fontWeight: 600 }}>{message}</p>
      <p style={{ color: "#8896b3", fontSize: "12px", marginTop: "6px" }}>
        Ollama may take 1–3 min on first run. Cached results are instant.
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: "12px",
      padding: "16px 20px", display: "flex", gap: "10px",
    }}>
      <span>❌</span>
      <div>
        <p style={{ fontWeight: 700, color: "#fca5a5", marginBottom: "4px", fontSize: "14px" }}>
          Error
        </p>
        <p style={{ color: "#ef4444", fontSize: "13px" }}>{message}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "16px",
      color: "#f0f4ff", marginBottom: "14px",
    }}>
      {children}
    </h2>
  );
}

// ── Movie input box ───────────────────────────────────────────────
function MovieInput({
  value, onChange, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Movie title, TMDB link, or IMDB link…"}
      disabled={disabled}
      style={{
        width:        "100%",
        background:   "#141824",
        border:       "1.5px solid #252d45",
        borderRadius: "10px",
        padding:      "11px 14px",
        color:        "#f0f4ff",
        fontSize:     "14px",
        outline:      "none",
        opacity:      disabled ? 0.6 : 1,
      }}
      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
      onBlur={(e)  => (e.target.style.borderColor = "#252d45")}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {

  // ── Single analysis ──
  const [movieInput,     setMovieInput]     = useState("");
  const [targetCountry,  setTargetCountry]  = useState("India");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [result,         setResult]         = useState<AlignmentDocument | null>(null);

  // ── Comparison ──
  const [cmpMovieInput,  setCmpMovieInput]  = useState("");
  const [cmpLoading,     setCmpLoading]     = useState(false);
  const [cmpError,       setCmpError]       = useState<string | null>(null);
  const [cmpResult,      setCmpResult]      = useState<CompareResponse | null>(null);

  // Multi-select for comparison (checkbox style)
  const [cmpSelected, setCmpSelected] = useState<string[]>([
    "United States", "France", "Japan", "South Korea", "UAE",
  ]);

  // ── Single analyze handler ──
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

  // ── Compare handler ──
  // The selected target country is automatically EXCLUDED from comparison list
  const handleCompare = async () => {
    const src = cmpMovieInput.trim() || movieInput.trim();
    if (!src) return;

    // Exclude the currently selected target country from comparison
    const regionsToCompare = cmpSelected.filter((c) => c !== targetCountry);
    if (!regionsToCompare.length) {
      setCmpError("Please select at least one country different from your target country.");
      return;
    }

    setCmpLoading(true);
    setCmpError(null);
    setCmpResult(null);
    try {
      const data = await compareMovieAcrossRegions(src, regionsToCompare);
      setCmpResult(data);
    } catch (e: unknown) {
      setCmpError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setCmpLoading(false);
    }
  };

  const toggleCmpCountry = (name: string) => {
    setCmpSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // ── Input hint: detect if it's a link ──
  const inputIsLink = movieInput.includes("tmdb") || movieInput.includes("imdb");

  return (
    <div>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "30px",
          color: "#f0f4ff", marginBottom: "6px", letterSpacing: "-0.02em",
        }}>
          🎬 AI Cultural Alignment
        </h1>
        <p style={{ color: "#8896b3", fontSize: "14px", marginBottom: "24px" }}>
          Analyze how well a movie fits any country's culture — supports movie titles,
          TMDB links, and IMDB links.
        </p>

        {/* ── Input row ── */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#8896b3",
                            display: "block", marginBottom: "6px" }}>
              Movie — title or link
            </label>
            <MovieInput
              value={movieInput}
              onChange={setMovieInput}
              placeholder="e.g. Inception  |  tmdb.org/movie/27205  |  imdb.com/title/tt1375666"
              disabled={loading}
            />
            {inputIsLink && (
              <p style={{ fontSize: "11px", color: "#6366f1", marginTop: "4px" }}>
                ✓ Link detected — will fetch directly from TMDB/IMDB
              </p>
            )}
          </div>

          <div>
            <CountrySelector
              selected={targetCountry}
              onChange={setTargetCountry}
              disabled={loading}
              label="Target Country"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !movieInput.trim()}
            style={{
              background:   "linear-gradient(135deg,#6366f1,#4f46e5)",
              color:        "#fff",
              border:       "none",
              borderRadius: "10px",
              padding:      "11px 22px",
              fontWeight:   700,
              fontSize:     "14px",
              cursor:       loading || !movieInput.trim() ? "not-allowed" : "pointer",
              opacity:      !movieInput.trim() ? 0.5 : 1,
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              whiteSpace:   "nowrap",
              height:       "42px",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "14px", height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }} />
                Analyzing…
              </>
            ) : "🔍 Analyze"}
          </button>
        </div>

        {/* Supported input hints */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          {[
            "📝 Plain title: \"KGF Chapter 2\"",
            "🔗 TMDB: themoviedb.org/movie/12345",
            "🎬 IMDB: imdb.com/title/tt1375666",
          ].map((hint) => (
            <span key={hint} style={{
              fontSize: "11px", color: "#8896b3",
              background: "#141824", border: "1px solid #252d45",
              borderRadius: "6px", padding: "3px 8px",
            }}>
              {hint}
            </span>
          ))}
        </div>
      </div>

      {/* ══ ANALYSIS RESULT ══════════════════════════════════════ */}
      {loading && (
        <LoadingCard message={`Analyzing "${movieInput}" for ${targetCountry}…`} />
      )}
      {error && !loading && <ErrorCard message={error} />}

      {result && !loading && (
        <div style={{ animation: "fadeUp 0.4s ease both" }}>
          <style>{`
            @keyframes fadeUp {
              from { opacity:0; transform:translateY(14px); }
              to   { opacity:1; transform:translateY(0); }
            }
          `}</style>

          {result.cached && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#1e1f4a", border: "1px solid #312e81",
              borderRadius: "8px", padding: "4px 12px", marginBottom: "14px",
              fontSize: "12px", color: "#818cf8",
            }}>
              ⚡ Loaded instantly from cache
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "22px",
          }}>
            {/* Left: movie details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SectionTitle>🎞️ Movie Details</SectionTitle>
              <MovieDetailsCard
                movie={result.movie}
                originRegion={result.origin_region?.region ?? "Unknown"}
              />
            </div>

            {/* Right: score + flags + similar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SectionTitle>🎯 Cultural Fit — {result.target_region}</SectionTitle>
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

      {/* ══ COMPARISON SECTION ════════════════════════════════════ */}
      <div style={{
        marginTop: "40px",
        background: "#141824",
        border:     "1px solid #252d45",
        borderRadius: "16px",
        padding:    "24px",
      }}>
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          flexWrap:       "wrap",
          gap:            "14px",
          marginBottom:   "20px",
        }}>
          <div>
            <SectionTitle>📊 Compare Across Countries</SectionTitle>
            <p style={{ color: "#8896b3", fontSize: "13px", marginTop: "-8px" }}>
              Your target country (<strong style={{ color: "#a5b4fc" }}>{targetCountry}</strong>) is
              automatically excluded — comparison shows other countries only.
              Uses one AI call for all — much faster.
            </p>
          </div>
          <button
            onClick={handleCompare}
            disabled={cmpLoading || (!cmpMovieInput.trim() && !movieInput.trim())}
            style={{
              background:   "linear-gradient(135deg,#4f46e5,#3730a3)",
              color:        "#fff",
              border:       "none",
              borderRadius: "10px",
              padding:      "10px 18px",
              fontWeight:   700,
              fontSize:     "13px",
              cursor:       cmpLoading ? "not-allowed" : "pointer",
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
              whiteSpace:   "nowrap",
            }}
          >
            {cmpLoading
              ? "Comparing…"
              : `📊 Compare (${cmpSelected.filter((c) => c !== targetCountry).length} countries)`}
          </button>
        </div>

        {/* Optional: different movie for comparison */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#8896b3",
                          display: "block", marginBottom: "6px" }}>
            Movie to compare (leave blank to use same as above)
          </label>
          <MovieInput
            value={cmpMovieInput}
            onChange={setCmpMovieInput}
            placeholder={movieInput || "Title, TMDB link, or IMDB link…"}
            disabled={cmpLoading}
          />
        </div>

        {/* Country toggles for comparison */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#8896b3",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      marginBottom: "10px" }}>
            Select countries to compare
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {COUNTRIES.map((c) => {
              const isOn      = cmpSelected.includes(c.name);
              const isTarget  = c.name === targetCountry;
              return (
                <button
                  key={c.name}
                  onClick={() => !isTarget && toggleCmpCountry(c.name)}
                  disabled={cmpLoading || isTarget}
                  title={isTarget ? `${c.name} is your target country — excluded from comparison` : ""}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "5px",
                    padding:      "5px 10px",
                    borderRadius: "7px",
                    border:       isTarget
                      ? "1.5px dashed #334155"
                      : isOn
                        ? "1.5px solid #4f46e5"
                        : "1.5px solid #252d45",
                    background:   isTarget ? "transparent" : isOn ? "#1e1a4a" : "#0d0f18",
                    color:        isTarget ? "#334155" : isOn ? "#a5b4fc" : "#8896b3",
                    fontSize:     "12px",
                    fontWeight:   isOn ? 700 : 400,
                    cursor:       isTarget || cmpLoading ? "not-allowed" : "pointer",
                    opacity:      isTarget ? 0.4 : cmpLoading ? 0.5 : 1,
                    transition:   "all 0.12s",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{c.flag}</span>
                  {c.name}
                  {isOn && !isTarget && <span style={{ opacity: 0.6 }}>✓</span>}
                  {isTarget && <span style={{ fontSize: "9px" }}>excluded</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {cmpLoading && (
          <LoadingCard message="Scoring all selected countries in one AI call…" />
        )}
        {cmpError && !cmpLoading && (
          <ErrorCard message={cmpError} />
        )}
        {cmpResult && !cmpLoading && (
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            <style>{`
              @keyframes fadeUp {
                from { opacity:0; transform:translateY(14px); }
                to   { opacity:1; transform:translateY(0); }
              }
            `}</style>
            <ComparisonCards
              entries={cmpResult.entries}
              movieTitle={cmpResult.movie.title}
            />
          </div>
        )}
        {!cmpResult && !cmpLoading && !cmpError && (
          <div style={{
            textAlign: "center", color: "#8896b3", fontSize: "13px",
            padding: "36px 0", border: "1px dashed #252d45", borderRadius: "10px",
          }}>
            Select countries above and click Compare to see AI-scored results with reasoning.
          </div>
        )}
      </div>
    </div>
  );
}