"use client";
import { useState }                        from "react";
import { compareMovieAcrossRegions }       from "@/lib/api";
import { CompareResponse }                 from "@/types";
import { COUNTRIES }                       from "@/components/CountrySelector";
import ComparisonCards                     from "@/components/ComparisonCards";

function LoadingCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#111827", border: "1px solid #1e2438", borderRadius: "18px",
      padding: "56px 24px", textAlign: "center",
    }}>
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
        One AI call for all countries. Cached combos load instantly.
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#160a0a", border: "1px solid #5b1d1d", borderRadius: "14px",
      padding: "18px 22px", display: "flex", gap: "12px",
    }}>
      <span>❌</span>
      <p style={{ color: "#f87171", fontSize: "14px" }}>{message}</p>
    </div>
  );
}

export default function ComparePage() {
  const [movieInput, setMovieInput]   = useState("");
  const [selected,   setSelected]     = useState<string[]>(["United States", "France", "Japan", "UAE", "South Korea"]);
  const [loading,    setLoading]      = useState(false);
  const [error,      setError]        = useState<string | null>(null);
  const [result,     setResult]       = useState<CompareResponse | null>(null);

  const toggleCountry = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleCompare = async () => {
    if (!movieInput.trim() || selected.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await compareMovieAcrossRegions(movieInput.trim(), selected);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputIsLink = movieInput.includes("themoviedb") || movieInput.includes("imdb");

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "34px",
          color: "#f0f4ff", marginBottom: "8px", letterSpacing: "-0.025em",
        }}>
          📊 Compare Across Countries
        </h1>
        <p style={{ color: "#4b5a73", fontSize: "15px", marginBottom: "26px", lineHeight: 1.6 }}>
          Score a movie against multiple countries in one AI call.
          Previously analyzed combos load from cache instantly.
        </p>

        {/* Movie input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5a73",
                          display: "block", marginBottom: "7px", textTransform: "uppercase",
                          letterSpacing: "0.08em" }}>
            Movie — title or link
          </label>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 300px" }}>
              <input
                type="text"
                value={movieInput}
                onChange={(e) => setMovieInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleCompare()}
                placeholder='e.g. "KGF Chapter 2"  or  paste TMDB / IMDB link'
                disabled={loading}
                style={{
                  width: "100%", background: "#111827", border: "1.5px solid #1e2438",
                  borderRadius: "12px", padding: "13px 16px", color: "#f0f4ff",
                  fontSize: "15px", outline: "none", boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e)  => (e.target.style.borderColor = "#1e2438")}
              />
              {inputIsLink && (
                <span style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "11px", color: "#6366f1", fontWeight: 600,
                  background: "rgba(99,102,241,0.12)", padding: "2px 7px", borderRadius: "6px",
                }}>✓ link</span>
              )}
            </div>
            <button
              onClick={handleCompare}
              disabled={loading || !movieInput.trim() || selected.length === 0}
              style={{
                background:   "linear-gradient(135deg,#6366f1,#4f46e5)",
                color:        "#fff", border: "none", borderRadius: "12px",
                padding:      "13px 24px", fontWeight: 700, fontSize: "15px",
                cursor:       loading || !movieInput.trim() ? "not-allowed" : "pointer",
                opacity:      !movieInput.trim() || selected.length === 0 ? 0.45 : 1,
                boxShadow:    "0 4px 18px rgba(99,102,241,0.35)",
                display:      "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap",
              }}
            >
              {loading
                ? <><span style={{ width:"15px", height:"15px", border:"2px solid rgba(255,255,255,0.25)",
                                   borderTopColor:"#fff", borderRadius:"50%", display:"inline-block",
                                   animation:"spin 0.75s linear infinite" }} /> Comparing…</>
                : `📊 Compare (${selected.length})`}
            </button>
          </div>
        </div>

        {/* Country toggles */}
        <div style={{
          background: "#111827", border: "1px solid #1e2438",
          borderRadius: "16px", padding: "20px",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#4b5a73",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
            Select countries to compare
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {COUNTRIES.map((c) => {
              const isOn = selected.includes(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => toggleCountry(c.name)}
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "8px",
                    border:     isOn ? "1.5px solid #6366f1" : "1.5px solid #1e2438",
                    background: isOn ? "rgba(99,102,241,0.15)" : "#0a0c14",
                    color:      isOn ? "#a5b4fc" : "#4b5a73",
                    fontSize: "13px", fontWeight: isOn ? 700 : 400,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                    transition: "all 0.12s",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{c.flag}</span>
                  {c.name}
                  {isOn && <span style={{ fontSize: "11px", opacity: 0.7 }}>✓</span>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "12px", color: "#2e3a50", marginTop: "12px" }}>
            {selected.length} selected — up to 10 recommended for best readability
          </p>
        </div>
      </div>

      {/* Results */}
      {loading && <LoadingCard message={`Comparing "${movieInput}" across ${selected.length} countries…`} />}
      {error && !loading && <ErrorCard message={error} />}
      {result && !loading && (
        <div style={{ animation: "fadeUp 0.45s ease both" }}>
          <style>{`
            @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          `}</style>
          <ComparisonCards entries={result.entries} movieTitle={result.movie.title} />
        </div>
      )}
      {!result && !loading && !error && (
        <div style={{
          textAlign: "center", color: "#2e3a50", fontSize: "14px",
          padding: "56px 24px", border: "1px dashed #1e2438", borderRadius: "16px",
        }}>
          Enter a movie and select countries above, then click Compare.
        </div>
      )}
    </div>
  );
}