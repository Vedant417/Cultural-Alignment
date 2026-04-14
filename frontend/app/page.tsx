"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter }    from "next/navigation";
import { analyzeMovie, getCachedAnalysis } from "@/lib/api";
import { AlignmentDocument }             from "@/types";
import CountrySelector                   from "@/components/CountrySelector";
import MovieDetailsCard                  from "@/components/MovieDetailsCard";
import ScoreBadge                        from "@/components/ScoreBadge";
import ContentFlags                      from "@/components/ContentFlags";
import SimilarMovies                     from "@/components/SimilarMovies";

/* ── Inline UI atoms — all use CSS vars ──────────────────────── */

function Spinner({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid var(--border)`,
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.75s linear infinite",
    }} />
  );
}

function LoadingState({ movie, country }: { movie: string; country: string }) {
  return (
    <div className="ca-card" style={{ padding: "64px 24px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <Spinner size={42} />
      </div>
      <p style={{ color: "var(--text)", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
        Analyzing <em style={{ color: "var(--accent)" }}>{movie}</em> for {country}…
      </p>
      <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
        Cached results appear instantly · First-time analysis takes 1–3 min on CPU
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      background:   "var(--red-dim)",
      border:       "1px solid rgba(239,68,68,0.25)",
      borderRadius: "14px",
      padding:      "18px 22px",
      display:      "flex",
      gap:          "12px",
      alignItems:   "flex-start",
    }}>
      <span style={{ fontSize: "20px", flexShrink: 0 }}>❌</span>
      <div>
        <p style={{ color: "var(--red)", fontWeight: 700, marginBottom: "4px", fontSize: "15px" }}>
          Analysis Failed
        </p>
        <p style={{ color: "var(--text-2)", fontSize: "14px" }}>{message}</p>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily:    "Sora, sans-serif",
      fontWeight:    700,
      fontSize:      "17px",
      color:         "var(--text)",
      marginBottom:  "14px",
      letterSpacing: "-0.01em",
    }}>
      {children}
    </h2>
  );
}

/* ── Main content ────────────────────────────────────────────── */
function AnalyzeContent() {
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const [movie,         setMovie]         = useState("");
  const [country,       setCountry]       = useState("India");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [result,        setResult]        = useState<AlignmentDocument | null>(null);
  const [inputFocused,  setInputFocused]  = useState(false);

  /* Pre-load from history redirect */
  useEffect(() => {
    const m = searchParams.get("movie");
    const r = searchParams.get("region");
    if (m && r) {
      setMovie(m);
      setCountry(r);
      setLoading(true);
      setError(null);
      setResult(null);
      getCachedAnalysis(m, r)
        .then(setResult)
        .catch(() => analyzeMovie(m, r).then(setResult).catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "Failed to load.")))
        .finally(() => setLoading(false));
      router.replace("/", { scroll: false });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!movie.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeMovie(movie.trim(), country);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isLink = movie.includes("themoviedb") || movie.includes("imdb");

  return (
    <div>

      {/* ════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "40px", position: "relative" }}>

        {/* Background glow — decorative, invisible in light mode */}
        <div style={{
          position:    "absolute",
          top:         "-60px",
          left:        "50%",
          transform:   "translateX(-50%)",
          width:       "600px",
          height:      "300px",
          background:  "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex:      0,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow label */}
          <div style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          "7px",
            background:   "var(--accent-dim)",
            border:       "1px solid var(--accent-glow)",
            borderRadius: "99px",
            padding:      "5px 13px",
            marginBottom: "18px",
          }}>
            <span style={{ fontSize: "12px" }}>✨</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>
              AI-POWERED CULTURAL ANALYSIS
            </span>
          </div>

          {/* Hero heading */}
          <h1 style={{
            fontSize:      "clamp(28px, 5vw, 48px)",
            fontFamily:    "Sora, sans-serif",
            fontWeight:    800,
            color:         "var(--text)",
            marginBottom:  "14px",
            letterSpacing: "-0.03em",
            lineHeight:    1.1,
          }}>
            How well does your movie{" "}
            <span style={{
              background:             "linear-gradient(135deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip:   "text",
              WebkitTextFillColor:    "transparent",
              backgroundClip:         "text",
            }}>
              fit the culture?
            </span>
          </h1>

          <p style={{
            fontSize:     "16px",
            color:        "var(--text-2)",
            marginBottom: "32px",
            maxWidth:     "540px",
            lineHeight:   1.7,
          }}>
            Enter any movie title, TMDB link, or IMDB link.
            Choose a country. Get an AI-scored cultural alignment in seconds.
          </p>

          {/* ── Search box ── */}
          <div style={{
            background:   "var(--bg-card)",
            border:       `1.5px solid ${inputFocused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "18px",
            padding:      "6px",
            display:      "flex",
            gap:          "8px",
            alignItems:   "center",
            flexWrap:     "wrap",
            maxWidth:     "820px",
            boxShadow:    inputFocused
              ? `0 0 0 4px var(--accent-dim), var(--shadow-card)`
              : "var(--shadow-card)",
            transition:   "border-color 0.2s, box-shadow 0.2s",
          }}>
            {/* Movie input */}
            <div style={{ flex: "1 1 240px", position: "relative", minWidth: "220px" }}>
              <span style={{
                position:  "absolute",
                left:      "14px",
                top:       "50%",
                transform: "translateY(-50%)",
                fontSize:  "16px",
                pointerEvents: "none",
              }}>
                🎬
              </span>
              <input
                type="text"
                value={movie}
                onChange={(e) => setMovie(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder='Movie title, TMDB link, or IMDB link…'
                disabled={loading}
                style={{
                  width:        "100%",
                  background:   "transparent",
                  border:       "none",
                  outline:      "none",
                  padding:      "13px 14px 13px 40px",
                  color:        "var(--text)",
                  fontSize:     "15px",
                  opacity:      loading ? 0.6 : 1,
                }}
              />
              {isLink && (
                <span style={{
                  position:     "absolute",
                  right:        "10px",
                  top:          "50%",
                  transform:    "translateY(-50%)",
                  fontSize:     "11px",
                  fontWeight:   700,
                  color:        "var(--accent)",
                  background:   "var(--accent-dim)",
                  padding:      "2px 8px",
                  borderRadius: "6px",
                }}>
                  ✓ link
                </span>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "30px", background: "var(--border)", flexShrink: 0 }} />

            {/* Country selector */}
            <div style={{ flexShrink: 0 }}>
              <CountrySelector
                selected={country}
                onChange={setCountry}
                disabled={loading}
              />
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !movie.trim()}
              className="ca-btn-primary"
              style={{ flexShrink: 0 }}
            >
              {loading ? (
                <><Spinner size={15} /> Analyzing…</>
              ) : (
                <>🔍 Analyze</>
              )}
            </button>
          </div>

          {/* Input type hints */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {[
              { icon: "📝", text: "\"Inception\"" },
              { icon: "🔗", text: "themoviedb.org/movie/27205" },
              { icon: "🎬", text: "imdb.com/title/tt1375666" },
              { icon: "📱", text: "m.imdb.com/title/tt1375666" },
            ].map(({ icon, text }) => (
              <button
                key={text}
                onClick={() => { setMovie(text.replace(/"/g, "")); }}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "5px",
                  fontSize:     "12px",
                  color:        "var(--text-3)",
                  background:   "var(--bg-card)",
                  border:       "1px solid var(--border)",
                  borderRadius: "8px",
                  padding:      "4px 10px",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.color = "var(--text)");
                  (e.currentTarget.style.borderColor = "var(--accent)");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.color = "var(--text-3)");
                  (e.currentTarget.style.borderColor = "var(--border)");
                }}
              >
                {icon} {text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RESULT STATES
          ════════════════════════════════════════════════════════ */}

      {loading && <LoadingState movie={movie} country={country} />}
      {error && !loading && <ErrorState message={error} />}

      {result && !loading && (
        <div className="fade-up">

          {/* Cache notice */}
          {result.cached && (
            <div style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "7px",
              background:   "var(--accent-dim)",
              border:       "1px solid var(--accent-glow)",
              borderRadius: "10px",
              padding:      "5px 13px",
              marginBottom: "20px",
              fontSize:     "13px",
              color:        "var(--accent)",
              fontWeight:   600,
            }}>
              ⚡ Loaded instantly from cache
            </div>
          )}

          {/* Two-column results */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap:                 "24px",
          }}>
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionHeading>🎞️ Movie Details</SectionHeading>
              <div className="ca-card">
                <MovieDetailsCard
                  movie={result.movie}
                  originRegion={result.origin_region?.region ?? "Unknown"}
                />
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionHeading>🎯 Cultural Fit — {result.target_region}</SectionHeading>
              <div className="ca-card">
                <ScoreBadge
                  result={result.result}
                  targetRegion={result.target_region}
                  cached={result.cached}
                />
              </div>
              <div className="ca-card">
                <ContentFlags flags={result.result.content_flags} />
              </div>
              <div className="ca-card">
                <SimilarMovies movies={result.result.similar_movies} />
              </div>
            </div>
          </div>

          {/* Quick-navigate to compare */}
          <div style={{
            marginTop:    "28px",
            padding:      "18px 22px",
            background:   "var(--accent-dim)",
            border:       "1px solid var(--accent-glow)",
            borderRadius: "14px",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"space-between",
            flexWrap:     "wrap",
            gap:          "12px",
          }}>
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: "2px" }}>
                Want to compare across countries?
              </p>
              <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
                See how <em>{result.movie.title}</em> scores in multiple regions side by side.
              </p>
            </div>
            <a
              href="/compare"
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "7px",
                background:   "linear-gradient(135deg,#6366f1,#4f46e5)",
                color:        "#fff",
                padding:      "9px 18px",
                borderRadius: "10px",
                fontWeight:   700,
                fontSize:     "14px",
                textDecoration:"none",
                boxShadow:    "0 4px 14px var(--accent-glow)",
                whiteSpace:   "nowrap",
              }}
            >
              📊 Go to Compare →
            </a>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          EMPTY STATE — feature cards
          ════════════════════════════════════════════════════════ */}
      {!result && !loading && !error && (
        <div style={{ marginTop: "8px" }}>
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap:                 "14px",
          }}>
            {[
              { icon:"🔍", title:"Smart Search",    desc:"Title, TMDB link, IMDB link, or bare IMDB ID — all work." },
              { icon:"🌍", title:"20 Countries",    desc:"Score for any of 20 countries across 6 global regions." },
              { icon:"⚡", title:"Instant Cache",   desc:"Repeat searches load from MongoDB in under a second." },
              { icon:"📊", title:"Compare Page",    desc:"Score one movie across all countries in a single AI call." },
              { icon:"💬", title:"AI Reasoning",    desc:"Every score comes with specific cultural reasoning." },
              { icon:"📜", title:"History",         desc:"Full history grouped by movie — click any to reload." },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="ca-card"
                style={{ padding: "20px" }}
              >
                <div style={{ fontSize: "26px", marginBottom: "10px" }}>{icon}</div>
                <h3 style={{ color: "var(--text)", marginBottom: "6px" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ color: "var(--text-3)", padding: "60px", textAlign: "center" }}>
        Loading…
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}