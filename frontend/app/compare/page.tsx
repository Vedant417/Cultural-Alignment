"use client";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { compareMovieAcrossRegions } from "@/lib/api";
import { CompareResponse } from "@/types";
import { COUNTRIES } from "@/components/CountrySelector";
import ComparisonCards from "@/components/ComparisonCards";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  const { t } = useLanguage();
  const [movieInput, setMovieInput] = useState("");

  // ✅ Mode toggle states
  const [mode, setMode] = useState<"countries" | "movies">("countries");
  const [movieB, setMovieB] = useState("");
  const [singleCountry, setSingleCountry] = useState("India");
  const [mvmResult, setMvmResult] = useState<MovieVsMovieResult | null>(null);

  const [selected, setSelected] = useState<string[]>([
    "United States",
    "France",
    "Japan",
    "UAE",
    "South Korea",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [focused, setFocused] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);

  const toggleCountry = (name: string) =>
    setSelected((p) =>
      p.includes(name) ? p.filter((c) => c !== name) : [...p, name]
    );

  const handleCompare = async () => {
    // Mode A (existing)
    if (mode === "countries") {
      if (!movieInput.trim() || selected.length === 0) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await compareMovieAcrossRegions(
          movieInput.trim(),
          selected
        );
        setResult(data);

        try {
          const rec = await fetch(
            `http://localhost:8000/api/recommend?title=${encodeURIComponent(
              movieInput
            )}`
          ).then((r) => r.json());

          setRecommendations(rec);
        } catch {}
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Comparison failed.");
      } finally {
        setLoading(false);
      }
    }

    // Mode B (UI ready – backend hook later)
    if (mode === "movies") {
      if (!movieInput.trim() || !movieB.trim()) return;

      setLoading(true);
      setError(null);
      setMvmResult(null);

      try {
        // TODO: replace with actual API
        // const data = await compareMoviesInCountry(movieInput, movieB, singleCountry);
        // setMvmResult(data);

        console.log("Compare Movies Mode:", {
          movieA: movieInput,
          movieB,
          country: singleCountry,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Comparison failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800 }}>
          {t("compare_hero_1")} <span style={{
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>{t("compare_hero_2")}</span>
        </h1>
        <p style={{ color: "var(--text-2)" }}>
          {t("compare_subtitle")}
        </p>
      </div>

      {/* ── MODE TOGGLE ── */}
      <div style={{
        display: "flex",
        gap: "6px",
        background: "var(--bg-deep)",
        borderRadius: "12px",
        padding: "5px",
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

      {/* ── INPUT ── */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "16px",
        alignItems: "center"
      }}>
        <input
          value={movieInput}
          onChange={(e) => setMovieInput(e.target.value)}
          placeholder={t("movie_placeholder")}
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            flex: 1
          }}
        />

        <button onClick={handleCompare} className="ca-btn-primary">
          {loading ? <Spinner /> : t("compare_btn")}
        </button>
      </div>

      {/* LanguageSwitcher ─ immediately after Compare button */}
      <div style={{ marginTop: "12px", marginBottom: "8px" }}>
        <LanguageSwitcher />
      </div>

      {/* ── MODE B EXTRA INPUTS ── */}
      {mode === "movies" && (
        <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
          <input
            placeholder={t("movie_b_placeholder")}
            value={movieB}
            onChange={(e) => setMovieB(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              flex: 1
            }}
          />

          <select
            value={singleCountry}
            onChange={(e) => setSingleCountry(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
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

      {/* ── COUNTRY SELECT (Mode A only) ── */}
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
                padding: "6px 10px",
                borderRadius: "8px",
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

      {/* ── RESULTS ── */}
      {loading && <LoadingCard message={t("comparing")} />}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Mode A Results */}
      {mode === "countries" && result && !loading && (
        <div className="fade-up">
          <ComparisonCards
            entries={result.entries}
            movieTitle={result.movie.title}
          />
        </div>
      )}

      {/* Mode B Placeholder */}
      {mode === "movies" && mvmResult && (
        <div className="fade-up">
          {/* future Movie vs Movie UI */}
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
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