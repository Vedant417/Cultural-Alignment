"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "@/hooks/useTranslation";
import { compareMovieAcrossRegions, compareTwoMovies } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { CompareResponse } from "@/types";
import type { SupportedLang } from "@/lib/translate";
import { COUNTRIES } from "@/components/CountrySelector";
import ComparisonCards from "@/components/ComparisonCards";
import MovieVsMovieComparison from "@/components/MovieVsMovieComparison";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSearchParams } from "next/navigation";
import { getProjectTitles } from "@/lib/projects";

// (optional type placeholder if not defined yet)
type MovieVsMovieResult = any;

function Spinner({ size = 15 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      border: "2px solid rgba(255,255,255,0.25)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.75s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="ca-card" style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "3px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 0.75s linear infinite",
      }} />
      <p style={{ color: "var(--text)", fontSize: "15px", fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
}

export default function ComparePage() {
  const { t, lang } = useLanguage();
  const { translateEntries, isTranslating } = useTranslation();
  const [movieInput, setMovieInput] = useState("");
  const [mode, setMode] = useState<"countries" | "movies">("countries");
  const searchParams = useSearchParams();
  const [movieB, setMovieB] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("India");
  const [twoMovieResult, setTwoMovieResult] = useState<any | null>(null);
  const [twoMovieCached, setTwoMovieCached] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [displayResult, setDisplayResult] = useState<CompareResponse | null>(null);
  const [focused, setFocused] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allowedTitles, setAllowedTitles] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);

  const toggleCountry = (name: string) =>
    setSelected((p) =>
      p.includes(name) ? p.filter((c) => c !== name) : [...p, name]
    );

  useEffect(() => {
    const modeParam = searchParams.get("mode");

    if (modeParam === "movies") {
      setMode("movies");
    }

    if (modeParam === "countries") {
      setMode("countries");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!result || !result.entries) return;
    if (lang === "en") {
      setDisplayResult(result);
      return;
    }
    const doTranslate = async () => {
      try {
        const translated = await translateEntries(result.entries, lang as SupportedLang);
        setDisplayResult({
          ...result,
          entries: translated.map((t, i) => ({
            ...result.entries[i],
            reason: t.reason,
            label: t.label,
          })),
        });
      } catch (e) {
        console.error("Translation error:", e);
        setDisplayResult(result);
      }
    };
    doTranslate();
  }, [lang, result, translateEntries]);

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

  const isMovieAllowed = (movieName: string) => {
    const normalizedMovie = movieName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    return allowedTitles.some((t: any) => {
      const normalizedTitle = (t.title || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      return normalizedTitle === normalizedMovie;
    });
  };

  const handleCompare = async () => {

    setError(null);

    setResult(null);
    setDisplayResult(null);

    setTwoMovieResult(null);
    setTwoMovieCached(false);

    // Mode A (existing)
    if (mode === "countries") {
      if (!movieInput.trim() || selected.length === 0) return;

      if (catalogLoading) return;

      if (!isMovieAllowed(movieInput)) {
        setError("This title is not available in the MediaShippers catalog.");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await compareMovieAcrossRegions(
          movieInput.trim(),
          selected
        );
        setResult(data);
        if (lang === "en") {
          setDisplayResult(data);
        } else if (data.entries && data.entries.length > 0) {
          const translated = await translateEntries(data.entries, lang as SupportedLang);
          setDisplayResult({
            ...data,
            entries: translated.map((t, i) => ({
              ...data.entries[i],
              reason: t.reason,
              label: t.label,
            })),
          });
        } else {
          setDisplayResult(data);
        }

        try {
          const rec = await fetch(
            `${BASE}/api/analyze/recommend`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: movieInput,
                region: selected[0] || "United States",
                score: result?.entries[0]?.score || 7,
                genre: "",
              })
            }
          ).then((r) => r.json());

          setRecommendations(rec.recommendations || []);
        } catch {}
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Comparison failed.");
      } finally {
        setLoading(false);
      }
    }

    // Mode B (Movie vs Movie)
    if (mode === "movies") {
      if (!movieInput.trim() || !movieB.trim()) {
        setError("Enter both Movie A and Movie B.");
        return;
      }

      if (catalogLoading) return;

      const movieAAllowed = isMovieAllowed(movieInput);
      const movieBAllowed = isMovieAllowed(movieB);

      if (!movieAAllowed && !movieBAllowed) {
        setError("Movie A and B are not available in the MediaShippers catalog.");
        return;
      }

      if (!movieAAllowed) {
        setError("Movie A is not available in the MediaShippers catalog.");
        return;
      }

      if (!movieBAllowed) {
        setError("Movie B is not available in the MediaShippers catalog.");
        return;
      }

      const movieA_normalized = movieInput.trim().toLowerCase().replace(/\s+/g, " ");
      const movieB_normalized = movieB.trim().toLowerCase().replace(/\s+/g, " ");
      
      if (movieA_normalized === movieB_normalized) {
        setError("You selected the same movie twice. Please select two different movies to compare.");
        return;
      }

      setLoading(true);
      setError(null);
      setTwoMovieResult(null);
      setTwoMovieCached(false);

      try {
        // Always call fresh comparison - backend will use cached individual movies
        // but run AI once to make the comparison decision
        console.log("📡 Fetching comparison (AI will decide winner)");
        const data = await compareTwoMovies(
          movieInput.trim(),
          movieB.trim(),
          selectedRegion
        );
        setTwoMovieResult(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Comparison failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "34px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-120px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.10)",
            filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />

        <div className="ca-pill" style={{ marginBottom: "12px", width: "fit-content" }}>
          🌍 GLOBAL COMPARISON
        </div>

        <h1
          className="ca-hero-title"
          style={{
            fontSize: "clamp(22px, 4vw, 38px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: "18px",
          }}
        >
          Compare Across Countries
        </h1>

        <p
          style={{
            color: "var(--text-2)",
            fontSize: "15px",
            lineHeight: 1.6,
            maxWidth: "860px",
          }}
        >
          Discover how films resonate across different regions using
          AI-powered cultural intelligence scoring and audience fit analysis.
        </p>
      </div>

      <div style={{
        display: "flex",
        gap: "6px",
        background: "var(--bg-deep)",
        borderRadius: "12px",
        padding: "4px 10px",
        marginBottom: "24px",
        width: "fit-content",
      }}>
        {(["countries","movies"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "8px 18px",
              borderRadius: "9px",
              border: "none",
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--text-2)",
              fontWeight: mode === m ? 700 : 400,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m === "countries"
              ? t("mode_countries")
              : t("mode_movies")}
          </button>
        ))}
      </div>
      
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          alignItems: "center"
        }}>

          <div style={{ position: "relative", flex: 1 }}>
            <input
              value={movieInput}
              onChange={(e) => {
                setMovieInput(e.target.value);
                setError(null);
                setShowSuggestionsA(true);
              }}
              onFocus={() => setShowSuggestionsA(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestionsA(false), 150);
              }}
              placeholder={t("movie_placeholder")}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text)",
                width: "100%",
                fontSize: "14px"
              }}
            />

            {showSuggestionsA && movieInput.trim().length > 0 && (
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
                      .startsWith(movieInput.trim().toLowerCase())
                  )
                  .slice(0, 8)
                  .map((p) => (
                    <div
                      key={p.id}
                      onMouseDown={() => {
                        setMovieInput(p.title.trim());
                        setShowSuggestionsA(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        color: "var(--text)",
                        fontSize: "13px",
                      }}
                    >
                      🎬 {p.title}
                    </div>
                  ))}
              </div>
            )}
          </div>

  <button onClick={handleCompare} className="ca-btn-primary">
          {loading ? <Spinner /> : t("compare_btn")}
        </button>
      </div>

      {/* LanguageSwitcher ─ immediately after Compare button */}
      <div style={{ marginTop: "12px", marginBottom: "8px" }}>
        <LanguageSwitcher />
      </div>

      {mode === "movies" && (
        <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              placeholder={t("movie_b_placeholder")}
              value={movieB}
              onChange={(e) => {
                setMovieB(e.target.value);
                setError(null);
                setShowSuggestionsB(true);
              }}
              onFocus={() => setShowSuggestionsB(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestionsB(false), 150);
              }}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text)",
                width: "100%",
                fontSize: "14px"
              }}
            />

            {showSuggestionsB && movieB.trim().length > 0 && (
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
                      .startsWith(movieB.trim().toLowerCase())
                  )
                  .slice(0, 8)
                  .map((p) => (
                    <div
                      key={p.id}
                      onMouseDown={() => {
                        setMovieB(p.title.trim());
                        setShowSuggestionsB(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        color: "var(--text)",
                        fontSize: "13px",
                      }}
                    >
                      🎬 {p.title}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text)",
              fontSize: "14px"
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === "countries" && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "10px" }}>
            {t("select_countries")}
          </p>
          {COUNTRIES.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleCountry(c.name)}
              style={{
                margin: "4px",
                padding: "10px 14px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: selected.includes(c.name)
                  ? "var(--accent-dim)"
                  : "var(--bg-card)",
                color: selected.includes(c.name)
                  ? "var(--accent)"
                  : "var(--text-2)",
              }}
            >
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* RESULTS */}
      {loading && <LoadingCard message={t("comparing")} />}
      {error && <p style={{ color: "red" }}>{error}</p>}

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
          fontSize: "11px",
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

      {/* Mode A Results */}
      {mode === "countries" && (displayResult || result) && !loading && (displayResult || result)?.entries && (
        <div className="fade-up">
          <ComparisonCards
            entries={[...(displayResult || result)!.entries].sort(
              (a, b) => (b.score || 0) - (a.score || 0)
            )}
            movieTitle={(displayResult || result)!.movie.title}
          />
        </div>
      )}

      {/* Mode B Results - Movie vs Movie */}
      {mode === "movies" && twoMovieResult && !loading && (
        <div className="fade-up">
          <MovieVsMovieComparison
            movieA={twoMovieResult.movie_a}
            movieB={twoMovieResult.movie_b}
            targetRegion={twoMovieResult.target_region}
            cached={twoMovieCached}
          />
        </div>
      )}

      {mode === "countries" && result && recommendations.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <p className="ca-label" style={{ marginBottom: "12px" }}>
            🎯 Recommended for you
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {recommendations.map((r: any) => (
              <div
                key={r.title}
                className="ca-card"
                style={{
                  padding: "10px",
                  width: "120px",
                  cursor: "pointer"
                }}
                onClick={() => setMovieInput(r.title)}
              >
                <img
                  src={r.poster}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "6px"
                  }}
                />
                <p style={{ fontSize: "12px", textAlign: "center" }}>
                  {r.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!result && !loading && !error && mode === "countries" && (
        <div style={{
          textAlign: "center",
          color: "var(--text-3)",
          padding: "40px"
        }}>
          {t("no_result_hint")}
        </div>
      )}
    </div>
  );
}