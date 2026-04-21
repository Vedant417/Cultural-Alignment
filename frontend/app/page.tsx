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
import SimilarMovies from "@/components/SimilarMovies";
import RecommendationsSlider from "@/components/RecommendationsSlider";
import GenreButtons from "@/components/GenreButtons";
import PopularityTrendChart from "@/components/PopularityTrendChart";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

  /* ── 🔗 Deep-link handler (URL params: title/region) ── */
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
    if (!movie.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDisplayResult(null);
    setDisplayMovie(null);
    try {
      const data = await analyzeMovie(movie.trim(), country);
      setResult(data);
      // Auto-translate if not English
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

  // Auto-translate when language changes
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
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "40px", position: "relative" }}>

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
            fontSize: "clamp(28px, 5vw, 48px)",
            fontFamily: "Sora, sans-serif",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "14px",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            {t("Global Cultural Intelligence")}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t(" For Film Analysis")}
            </span>
          </h1>

          <p style={{
            fontSize: "16px",
            color: "var(--text-2)",
            marginBottom: "32px",
            maxWidth: "540px",
            lineHeight: 1.7,
          }}>
            {t("Transform how you understand movie reception across cultures. Our AI analyzes cultural nuances, content flags, and audience alignment for any film worldwide. Uncover insights, compare regions, and make informed entertainment choices with ease.")}
          </p>

          {/* ── Search box ── */}
          <div style={{
            background: "var(--bg-card)",
            border: `1.5px solid ${inputFocused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "18px",
            padding: "6px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
            maxWidth: "820px",
            boxShadow: inputFocused
              ? `0 0 0 4px var(--accent-dim), var(--shadow-card)`
              : "var(--shadow-card)",
            transition: "border-color 0.2s, box-shadow 0.2s",
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
                type="text"
                value={movie}
                onChange={(e) => setMovie(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={t("search_placeholder")}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "13px 14px 13px 40px",
                  color: "var(--text)",
                  fontSize: "15px",
                  opacity: loading ? 0.6 : 1,
                }}
              />
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
                <> <Spinner size={15} /> {t("analyzing_btn")} </>
              ) : (
                <>🔍 {t("analyze_btn")}</>
              )}
            </button>
          </div>

          {/* Input type hints */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {[
              { icon: "📝", text: '"MOVIE TITLE"'},
              { icon: "🔗", text: "themoviedb.org/movie/27205" },
              { icon: "🎬", text: "imdb.com/title/tt1375666" },
              { icon: "📱", text: "m.imdb.com/title/tt1375666" },
            ].map(({ icon, text }) => (
              <button
                key={text}
                onClick={() => { setMovie(text.replace(/"/g, " ")); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  color: "var(--text-3)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-3)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {icon} {text}
              </button>
            ))}
          </div>
          {/* LanguageSwitcher — immediately after Analyze button */}
          <div style={{ marginTop: "12px", marginBottom: "8px" }}>
            <LanguageSwitcher />
          </div>        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RESULT STATES
          ════════════════════════════════════════════════════════ */}

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
                />
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SectionHeading>{t("cultural_fit_heading")} — {result.target_region}</SectionHeading>
              <div className="ca-card">
                <ScoreBadge
                  result={displayResult || result.result}
                  targetRegion={result.target_region}
                  cached={result.cached}
                />
              </div>
              <div className="ca-card">
                <ContentFlags flags={(displayResult || result.result).content_flags} />
              </div>
              {result.movie?.popularity && result.movie.popularity > 0 && (
                <div className="ca-card">
                  <PopularityTrendChart 
                    popularity={result.movie.popularity} 
                    title={result.movie.title}
                  />
                </div>
              )}
              <div className="ca-card">
                <SimilarMovies movies={displayResult?.similar_movies || result.result.similar_movies} />
              </div>
              {(displayResult?.recommendations?.length || result.result.recommendations?.length) > 0 && (
                <div className="ca-card">
                  <RecommendationsSlider recommendations={displayResult?.recommendations || result.result.recommendations} />
                </div>
              )}
              {(displayResult?.genres?.length || result.result.genres?.length) > 0 && (
                <div className="ca-card">
                  <GenreButtons genres={displayResult?.genres || result.result.genres} />
                </div>
              )}
            </div>
          </div>

          {/* Quick-navigate to compare */}
          <div style={{
            marginTop: "28px",
            padding: "18px 22px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-glow)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: "2px" }}>
                {t("compare_prompt_title")}
              </p>
              <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
  {t("compare_prompt_desc")} <em>{result.movie.title}</em>
</p>
            </div>
            <a
              href="/compare"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#fff",
                padding: "9px 18px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 4px 14px var(--accent-glow)",
                whiteSpace: "nowrap",
              }}
            >
              📊 {t("go_to_compare")}
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "14px",
          }}>
            {[
              { icon: "🔍", title: t("feature_smart_search"), desc: t("feature_smart_search_desc") },
              { icon: "🌍", title: t("feature_countries"), desc: t("feature_countries_desc") },
              { icon: "⚡", title: t("feature_cache"), desc: t("feature_cache_desc") },
              { icon: "📊", title: t("feature_compare"), desc: t("feature_compare_desc") },
              { icon: "💬", title: t("feature_ai"), desc: t("feature_ai_desc") },
              { icon: "📜", title: t("feature_history"), desc: t("feature_history_desc") },
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