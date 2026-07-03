"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { analyzeMovie, getCachedAnalysis } from "@/lib/api";
import { AlignmentDocument, AnalysisResult, MovieInfo } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "@/hooks/useTranslation";
import type { SupportedLang } from "@/lib/translate";
import CountrySelector from "@/components/CountrySelector";
import MovieDetailsCard from "@/components/MovieDetailsCard";
import ScoreBadge from "@/components/ScoreBadge";
import ContentFlags from "@/components/ContentFlags";
import GenreButtons from "@/components/GenreButtons";
import PopularityTrendChart from "@/components/PopularityTrendChart";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import VoiceInput from "@/components/VoiceInput";
import { getProjectTitles } from "@/lib/projects";


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
  const { t } = useLanguage();
  return (
    <div className="ca-card" style={{ padding: "64px 24px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <Spinner size={42} />
      </div>
      <p style={{ color: "var(--text)", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
  {t("analyzing_for")} {movie} for {country}…
</p>
      <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
        {t("cache_info")}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useLanguage();
  return (
    <div style={{
      background: "var(--red-dim)",
      border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: "14px",
      padding: "18px 22px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "20px", flexShrink: 0 }}>❌</span>
      <div>
        <p style={{ color: "var(--red)", fontWeight: 700, marginBottom: "4px", fontSize: "15px" }}>
          {t("analysis_failed")}
        </p>
        <p style={{ color: "var(--text-2)", fontSize: "14px" }}>{message}</p>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Sora, sans-serif",
      fontWeight: 700,
      fontSize: "17px",
      color: "var(--text)",
      marginBottom: "14px",
      letterSpacing: "-0.01em",
    }}>
      {children}
    </h2>
  );
}

/* ── Main content ────────────────────────────────────────────── */
function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { translateResult, translateMovie, isTranslating } = useTranslation();
  
  const [movie, setMovie] = useState("");
  const [country, setCountry] = useState("India");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlignmentDocument | null>(null);
  const [displayResult, setDisplayResult] = useState<AnalysisResult | null>(null);
  const [displayMovie, setDisplayMovie] = useState<MovieInfo | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [allowedTitles, setAllowedTitles] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* Pre-load from history redirect (Next.js params: movie/region) */
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
          setError(e instanceof Error ? e.message : t("failed_to_load"))))
        .finally(() => setLoading(false));
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, t]);

useEffect(() => {
  const loadProjects = async () => {
    try {
      const titles = await getProjectTitles();
      setAllowedTitles(titles);
    } finally {
      setCatalogLoading(false);
    }
  };

  loadProjects();
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const t = params.get("title");
    const r = params.get("region");

    if (t && r) {
      setMovie(t);
      setCountry(r);
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    setDisplayResult(null);
    if (!movie.trim()) return;    

    if (catalogLoading) return;

  const normalizedMovie = movie
  .trim()
  .toLowerCase()
  .replace(/\s+/g, " ");

  const exists = allowedTitles.some((t: any) => {
    const normalizedTitle = (t.title || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    return normalizedTitle === normalizedMovie;
  });

  if (!exists) {
    setError("This title is not available in the MediaShippers catalog.");
    return;
  }
    setLoading(true);
    setError(null);
    setResult(null);
    setDisplayResult(null);
    setDisplayMovie(null);
    try {
      const data = await analyzeMovie(movie.trim(), country);
      setResult(data);
      if (lang !== "en") {
        const translatedResult = await translateResult(data.result, lang as SupportedLang);
        const translatedMovie = await translateMovie(data.movie, lang as SupportedLang);
        setDisplayResult({ ...data.result, ...translatedResult });
        setDisplayMovie({ ...data.movie, ...translatedMovie });
      } else {
        setDisplayResult(data.result);
        setDisplayMovie(data.movie);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result) return;
    if (lang === "en") {
      setDisplayResult(result.result);
      setDisplayMovie(result.movie);
      return;
    }
    const doTranslate = async () => {
      try {
        const translatedResult = await translateResult(result.result, lang as SupportedLang);
        const translatedMovie = await translateMovie(result.movie, lang as SupportedLang);
        setDisplayResult({ ...result.result, ...translatedResult });
        setDisplayMovie({ ...result.movie, ...translatedMovie });
      } catch (e) {
        console.error("Translation error:", e);
        setDisplayResult(result.result);
        setDisplayMovie(result.movie);
      }
    };
    doTranslate();
  }, [lang, result, translateResult, translateMovie]);

  const isLink = movie.includes("themoviedb") || movie.includes("imdb");

  return (
    <div>

      <div style={{ marginBottom: "24px", position: "relative" }}>

        {/* Background glow — decorative */}
        <div style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow label */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-glow)",
            borderRadius: "99px",
            padding: "5px 13px",
            marginBottom: "18px",
          }}>
            <span style={{ fontSize: "12px" }}>✨</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>
              {t("ai_powered_label")}
            </span>
          </div>

          {/* Hero heading */}
          <h1 style={{
            fontSize: "clamp(22px, 4vw, 38px)",
            fontFamily: "Sora, sans-serif",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            marginBottom: "22px",
            maxWidth: "1100px",
            color: "#f8fafc",
          }}
          >
            {t("Global Cultural Intelligence")}
            <span style={{
              background: "linear-gradient(135deg,#38bdf8,#8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t(" For Film Analysis")}
            </span>
          </h1>

          <p style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.68)",
            marginBottom: "42px",
            maxWidth: "720px",
            lineHeight: 1.7,
            fontWeight: 500,
          }}>
            {t("Analyze how films resonate across cultures using AI-powered audience intelligence, censorship insights, emotional alignment, and regional compatibility scoring.")}
          </p>

          {/* ── Search box ── */}
          <div style={{
            background: "rgba(15,23,42,0.78)",
            border:
              mounted && inputFocused
                ? "1px solid rgba(99,102,241,0.7)"
                : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "6px",
            display: "flex",
            gap: "14px",
            alignItems: "center",
            flexWrap: "wrap",
            maxWidth: "1050px",
            backdropFilter: "blur(18px)",
            boxShadow:
              mounted && inputFocused
                ? "0 0 0 4px rgba(99,102,241,0.15)"
                : "0 10px 40px rgba(0,0,0,0.45)",
            transition: "all 0.25s ease",

          }}>
            {/* Movie input */}
            <div style={{ flex: "1 1 240px", position: "relative", minWidth: "220px" }}>
              <span style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "16px",
                pointerEvents: "none",
              }}>
                🎬
              </span>
              
              <input
                autoFocus={false}
                type="text"
                value={movie}
                onChange={(e) => {
                  setMovie(e.target.value);

                  setError(null);
                  setResult(null);
                  setDisplayResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                onFocus={() => {
                  setInputFocused(true);
                  setShowSuggestions(true);
                }}

                onBlur={() => {
                  setInputFocused(false);

                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 150);
                }}
                placeholder={t("search_placeholder")}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "10px 12px 10px 38px",
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 500,
                  opacity: loading ? 0.6 : 1,
                }}
              />

              {/* ADD THIS HERE */}
              {showSuggestions && movie.trim().length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "52px",
                    left: 0,
                    right: 0,
                    background: "rgba(15,23,42,0.98)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 50,
                    backdropFilter: "blur(18px)",
                    maxHeight: "260px",
                    overflowY: "auto",
                  }}
                >
                  {allowedTitles
                    .filter((p) =>
                      p.title
                        ?.trim()
                        .toLowerCase()
                        .startsWith(movie.trim().toLowerCase())
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <div
                        key={p.id}
                        onMouseDown={() => {
                          setMovie(p.title.trim());
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderBottom:
                            "1px solid rgba(255,255,255,0.05)",
                          color: "var(--text)",
                          fontSize: "13px",
                        }}
                      >
                        🎬 {p.title}
                      </div>
                    ))}
                </div>
              )}
              {isLink && (
                <span style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}>
                  ✓ {t("link_badge")}
                </span>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "24px", background: "var(--border)", flexShrink: 0 }} />

            {/* Country selector */}
            <div style={{ flexShrink: 0 }}>
              <CountrySelector
                selected={country}
                onChange={setCountry}
                disabled={loading}
              />
            </div>

            {/* Voice Input */}
            <VoiceInput
              onVoiceInput={(text: string) => {
                setMovie(text);
              }}
              disabled={loading}
            />

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !movie.trim()}
              className="ca-btn-primary"
              style={{
                flexShrink: 0,
                height: "52px",
                padding: "0 24px",
                borderRadius: "14px",
                fontSize: "14px",
              }}
            >
              {loading ? (
                <> <Spinner size={15} /> {t("analyzing_btn")} </>
              ) : (
                <>🔍 {t("analyze_btn")}</>
              )}
            </button>
          </div>

          {/* LanguageSwitcher — immediately after Analyze button */}
          <div style={{ marginTop: "12px", marginBottom: "8px" }}>
            <LanguageSwitcher />
          </div>        </div>
      </div>


      {loading && <LoadingState movie={movie} country={country} />}
      {error && !loading && <ErrorState message={error} />}

      {result && !loading && (
        <div className="fade-up">

          {/* Translation indicator */}
          {isTranslating && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-glow)",
              borderRadius: "99px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "var(--accent)",
              marginBottom: "12px",
            }}>
              <span style={{
                width: "10px", height: "10px",
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }} />
              {t("translating") || "Translating..."}
            </div>
          )}

          {/* Cache notice */}
          {result.cached && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-glow)",
              borderRadius: "10px",
              padding: "5px 13px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "var(--accent)",
              fontWeight: 600,
            }}>
              ⚡ {t("loaded_from_cache")}
            </div>
          )}

          {/* Two-column results */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "24px",
          }}>
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionHeading>{t("movie_details_heading")}</SectionHeading>
              <div className="ca-card">
                <MovieDetailsCard
                  movie={displayMovie || result.movie}
                  originRegion={result.origin_region?.region ?? t("unknown")}
                  analysisId={result.id}
                />
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Header with compare button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <SectionHeading>{t("cultural_fit_heading")} — {result.target_region}</SectionHeading>
                <a
                  href="/compare"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    color: "#fff",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px var(--accent-glow)",
                    whiteSpace: "nowrap",
                  }}
                >
                  📊 {t("go_to_compare")}
                </a>
              </div>

              {/* Score Badge */}
              <div className="ca-card">
                <ScoreBadge
                  result={displayResult || result.result}
                  targetRegion={result.target_region}
                  cached={result.cached}
                />
              </div>

              {/* Content Flags */}
              <div className="ca-card">
                <ContentFlags flags={(displayResult || result?.result || {}).content_flags || {}} />
              </div>

              {/* Popularity Trend */}
              {result.movie?.popularity && result.movie.popularity > 0 && (
                <div className="ca-card">
                  <PopularityTrendChart 
                    popularity={result.movie.popularity} 
                    title={result.movie.title}
                    country={country}
                  />
                </div>
              )}
              
              {/* Genres */}
              {result?.result?.genres && (displayResult?.genres?.length || result?.result?.genres?.length) > 0 && (
                <div className="ca-card">
                  <GenreButtons genres={displayResult?.genres || result?.result?.genres || []} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {!result && !loading && !error && (
        <div style={{ marginTop: "8px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}>
            {[
  { icon: "🔍", title: t("feature_smart_search"), desc: t("feature_smart_search_desc") },
  { icon: "🌍", title: t("feature_countries"), desc: t("feature_countries_desc") },
  { icon: "⚡", title: t("feature_cache"), desc: t("feature_cache_desc") },
  { icon: "📊", title: t("feature_compare"), desc: t("feature_compare_desc") },
  { icon: "💬", title: t("feature_ai"), desc: t("feature_ai_desc") },

  {
    icon: "🎬",
    title: "CineAI Predictor",
    desc: "Predict commercial viability, ROI potential, emotional arcs and audience engagement."
  },

  { icon: "📜", title: t("feature_history"), desc: t("feature_history_desc") },
].map(({ icon, title, desc }) => (
  <a
    key={title}
    href={
      title === "CineAI Predictor"
        ? "/cineai"
        : title === t("feature_history")
        ? "/history"
        : title === t("feature_compare")
        ? "/compare?mode=movies"
        : title === t("feature_countries")
        ? "/compare?mode=countries"
        : title === t("feature_cache")
        ? "/favorites"
        : "#"
    }
    style={{ textDecoration: "none" }}
  >
    <div
      className="ca-card feature-card"
      style={{
        padding: "18px",
        height: "100%",
        minHeight: "170px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: "translateY(0px)",
      }}
    >
      <div style={{ fontSize: "22px", marginBottom: "8px" }}>
        {icon}
      </div>

      <h3
        style={{
          color: "var(--text)",
          marginBottom: "6px"
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "12px",
          color: "var(--text-3)",
          lineHeight: 1.55
        }}
      >
        {desc}
      </p>
    </div>
  </a>
))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {

  const router = useRouter();
  
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