"use client";
import { useState }           from "react";
import { analyzeMovie, analyzeMulti } from "@/lib/api";
import { AlignmentDocument, MultiAnalyzeResponse } from "@/types";
import CountrySelector, { COUNTRIES } from "@/components/CountrySelector";
import CulturalPieChart  from "@/components/CulturalPieChart";
import MovieDetailsCard  from "@/components/MovieDetailsCard";
import ScoreBadge        from "@/components/ScoreBadge";
import ContentFlags      from "@/components/ContentFlags";
import SimilarMovies     from "@/components/SimilarMovies";

// ── Inline SearchBar (avoids import issues) ──────────────────────
function SearchBar({
  value, onChange, onSubmit, loading,
}: {
  value: string; onChange: (v: string) => void;
  onSubmit: () => void; loading: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
        placeholder="e.g. KGF, Inception, Parasite, Toxic..."
        disabled={loading}
        style={{
          flex:             "1 1 260px",
          minWidth:         "200px",
          background:       "#141824",
          border:           "1.5px solid #252d45",
          borderRadius:     "12px",
          padding:          "12px 16px",
          color:            "#f0f4ff",
          fontSize:         "15px",
          outline:          "none",
          opacity:          loading ? 0.6 : 1,
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e)  => (e.target.style.borderColor = "#252d45")}
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        style={{
          background:    loading ? "#3730a3" : "linear-gradient(135deg,#6366f1,#4f46e5)",
          color:         "#fff",
          border:        "none",
          borderRadius:  "12px",
          padding:       "12px 24px",
          fontWeight:    700,
          fontSize:      "14px",
          cursor:        loading || !value.trim() ? "not-allowed" : "pointer",
          opacity:       !value.trim() ? 0.5 : 1,
          whiteSpace:    "nowrap",
          display:       "flex",
          alignItems:    "center",
          gap:           "8px",
          transition:    "all 0.15s",
        }}
      >
        {loading ? (
          <>
            <span style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,0.3)",
                           borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }}
                  className="animate-spin" />
            Analyzing…
          </>
        ) : "🔍 Analyze"}
      </button>
    </div>
  );
}

// ── Loading card ─────────────────────────────────────────────────
function LoadingCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#141824", border: "1px solid #252d45", borderRadius: "16px",
      padding: "48px 24px", textAlign: "center",
    }}>
      <div style={{ width:"40px", height:"40px", border:"3px solid #252d45",
                    borderTopColor:"#6366f1", borderRadius:"50%", margin:"0 auto 20px" }}
           className="animate-spin" />
      <p style={{ color: "#c8d3ea", fontSize:"14px", fontWeight:600 }}>{message}</p>
      <p style={{ color:"#8896b3", fontSize:"12px", marginTop:"6px" }}>
        Ollama may take 1–3 min on CPU. Cached results are instant.
      </p>
    </div>
  );
}

// ── Error card ───────────────────────────────────────────────────
function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{
      background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: "16px",
      padding: "20px 24px", display: "flex", gap: "12px", alignItems: "flex-start",
    }}>
      <span style={{ fontSize:"20px", marginTop:"1px" }}>❌</span>
      <div>
        <p style={{ fontWeight:700, color:"#fca5a5", marginBottom:"4px" }}>Analysis Failed</p>
        <p style={{ color:"#ef4444", fontSize:"14px" }}>{message}</p>
      </div>
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:"16px",
                 color:"#f0f4ff", marginBottom:"14px" }}>
      {children}
    </h2>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  const [movieInput,    setMovieInput]    = useState("");
  const [selectedCountry, setSelectedCountry] = useState("India");

  // Single analysis state
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<AlignmentDocument | null>(null);

  // Multi-country pie chart state
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError,   setChartError]   = useState<string | null>(null);
  const [chartData,    setChartData]    = useState<MultiAnalyzeResponse | null>(null);

  // Which countries user has selected for pie chart
  const [chartCountries, setChartCountries] = useState<string[]>([
    "India", "United States", "France", "Japan", "South Korea",
  ]);

  // ── Single analyze ─────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!movieInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setChartData(null);
    try {
      const data = await analyzeMovie(movieInput.trim(), selectedCountry);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Multi-country pie chart ─────────────────────────────────
  const handleCompare = async () => {
    if (!movieInput.trim() || chartCountries.length === 0) return;
    setChartLoading(true);
    setChartError(null);
    setChartData(null);
    try {
      const data = await analyzeMulti(movieInput.trim(), chartCountries);
      setChartData(data);
    } catch (e: unknown) {
      setChartError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setChartLoading(false);
    }
  };

  const toggleChartCountry = (name: string) => {
    setChartCountries((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize:"32px",
                     color:"#f0f4ff", marginBottom:"6px", letterSpacing:"-0.02em" }}>
          🎬 AI Cultural Alignment
        </h1>
        <p style={{ color:"#8896b3", fontSize:"15px", marginBottom:"28px" }}>
          Check how well any movie fits a country's culture — or compare across multiple regions.
        </p>
        <SearchBar
          value={movieInput}
          onChange={setMovieInput}
          onSubmit={handleAnalyze}
          loading={loading}
        />
      </div>

      {/* ══ COUNTRY SELECTOR ══════════════════════════════════ */}
      <div style={{ background:"#141824", border:"1px solid #252d45",
                    borderRadius:"16px", padding:"24px", marginBottom:"28px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      flexWrap:"wrap", gap:"12px", marginBottom:"18px" }}>
          <div>
            <SectionTitle>🌍 Choose Target Country</SectionTitle>
            <p style={{ color:"#8896b3", fontSize:"13px", marginTop:"-8px" }}>
              Selected: <strong style={{ color:"#a5b4fc" }}>{selectedCountry}</strong>
              {" "}— click Analyze above to score for this country.
            </p>
          </div>
        </div>
        <CountrySelector
          selected={selectedCountry}
          onChange={setSelectedCountry}
          disabled={loading}
        />
      </div>

      {/* ══ SINGLE ANALYSIS RESULT ════════════════════════════ */}
      {loading && <LoadingCard message={`Analyzing "${movieInput}" for ${selectedCountry}…`} />}
      {error   && !loading && <ErrorCard message={error} />}

      {result && !loading && (
        <div className="fade-up">
          {/* Cache badge */}
          {result.cached && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:"6px",
              background:"#1e1f4a", border:"1px solid #312e81",
              borderRadius:"8px", padding:"4px 12px", marginBottom:"16px",
              fontSize:"12px", color:"#818cf8",
            }}>
              ⚡ Loaded from cache — instant result
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px" }}>
            {/* Left */}
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <SectionTitle>🎞️ Movie Details</SectionTitle>
              <MovieDetailsCard
                movie={result.movie}
                originRegion={result.origin_region?.region ?? "Unknown"}
              />
            </div>
            {/* Right */}
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
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

      {/* ══ MULTI-COUNTRY PIE CHART ════════════════════════════ */}
      <div style={{
        background:"#141824", border:"1px solid #252d45",
        borderRadius:"16px", padding:"24px", marginTop:"36px",
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                      flexWrap:"wrap", gap:"14px", marginBottom:"20px" }}>
          <div>
            <SectionTitle>📊 Compare Across Countries</SectionTitle>
            <p style={{ color:"#8896b3", fontSize:"13px", marginTop:"-8px" }}>
              Select countries below, then click Compare to see the pie chart.
              Previously analyzed combos load from cache instantly.
            </p>
          </div>
          <button
            onClick={handleCompare}
            disabled={chartLoading || !movieInput.trim() || chartCountries.length === 0}
            style={{
              background:   "linear-gradient(135deg,#4f46e5,#3730a3)",
              color:        "#fff",
              border:       "none",
              borderRadius: "10px",
              padding:      "10px 20px",
              fontWeight:   700,
              fontSize:     "13px",
              cursor:       chartLoading || !movieInput.trim() ? "not-allowed" : "pointer",
              opacity:      (!movieInput.trim() || chartCountries.length === 0) ? 0.5 : 1,
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
            }}
          >
            {chartLoading ? "Comparing…" : `📊 Compare (${chartCountries.length} countries)`}
          </button>
        </div>

        {/* Country toggle grid for chart */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"20px" }}>
          {COUNTRIES.map((c) => {
            const isOn = chartCountries.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => toggleChartCountry(c.name)}
                disabled={chartLoading}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "5px",
                  padding:      "5px 10px",
                  borderRadius: "7px",
                  border:       isOn ? "1.5px solid #4f46e5" : "1.5px solid #252d45",
                  background:   isOn ? "#1e1a4a"             : "#0d0f18",
                  color:        isOn ? "#a5b4fc"             : "#8896b3",
                  fontSize:     "12px",
                  fontWeight:   isOn ? 700 : 400,
                  cursor:       chartLoading ? "not-allowed" : "pointer",
                  opacity:      chartLoading ? 0.5 : 1,
                  transition:   "all 0.12s",
                }}
              >
                <span style={{ fontSize:"14px" }}>{c.flag}</span>
                {c.name}
                {isOn && <span style={{ marginLeft:"2px", opacity:0.7 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Chart area */}
        {chartLoading && (
          <LoadingCard message="Fetching scores for all selected countries…" />
        )}
        {chartError && !chartLoading && (
          <ErrorCard message={chartError} />
        )}
        {chartData && !chartLoading && (
          <div className="fade-up">
            <CulturalPieChart
              scores={chartData.scores}
              movieTitle={chartData.movie.title}
            />
          </div>
        )}
        {!chartData && !chartLoading && !chartError && (
          <div style={{
            textAlign:"center", color:"#8896b3", fontSize:"14px",
            padding:"40px 0", border:"1px dashed #252d45", borderRadius:"12px",
          }}>
            Enter a movie name above and click <strong style={{color:"#c8d3ea"}}>Compare</strong> to see the cultural fit chart.
          </div>
        )}
      </div>
    </div>
  );
}