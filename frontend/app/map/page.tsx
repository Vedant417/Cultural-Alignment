"use client";
import { useState, useEffect }          from "react";
import { ComposableMap, Geographies, Geography, Tooltip } from "react-simple-maps";
import { getGroupedHistory }            from "@/lib/api";

// ISO-3166-Alpha3 map for the 20 supported countries
const COUNTRY_ISO3: Record<string, string> = {
  "India":          "IND", "Bangladesh":  "BGD", "Pakistan":    "PAK",
  "Japan":          "JPN", "South Korea": "KOR", "China":       "CHN",
  "Singapore":      "SGP", "France":      "FRA", "Germany":     "DEU",
  "Italy":          "ITA", "Spain":       "ESP", "United Kingdom": "GBR",
  "Russia":         "RUS", "United States":"USA", "Brazil":      "BRA",
  "Mexico":         "MEX", "UAE":         "ARE", "Saudi Arabia": "SAU",
  "Egypt":          "EGY", "Australia":   "AUS",
};

function scoreToColor(score: number | null): string {
  if (score === null) return "#2a2d3e";
  if (score >= 8)  return "#22c55e";
  if (score >= 6)  return "#f59e0b";
  if (score >= 4)  return "#f97316";
  return "#ef4444";
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function MapPage() {
  const [movies,        setMovies]        = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [scoreMap,      setScoreMap]      = useState<Record<string, number | null>>({});
  const [tooltip,       setTooltip]       = useState<string>("");

  useEffect(() => {
    getGroupedHistory().then((groups) => {
      const titles = groups.map((g: any) => g.title);
      setMovies(titles);
      if (titles.length) setSelectedMovie(titles[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedMovie) return;
    getGroupedHistory().then((groups: any[]) => {
      const group = groups.find((g) => g.title === selectedMovie);
      if (!group) return;
      const sm: Record<string, number | null> = {};
      for (const entry of group.entries) {
        sm[entry.target_region] = entry.score ?? null;
      }
      setScoreMap(sm);
    });
  }, [selectedMovie]);

  // Reverse lookup: ISO3 → region name
  const iso3ToRegion = Object.fromEntries(
    Object.entries(COUNTRY_ISO3).map(([name, iso]) => [iso, name])
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{
          display: "inline-flex", gap: "7px", alignItems: "center",
          background: "var(--accent-dim)", border: "1px solid var(--accent-glow)",
          borderRadius: "99px", padding: "5px 13px", marginBottom: "16px",
        }}>
          <span style={{ fontSize: "12px" }}>🗺️</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>
            WORLD MAP
          </span>
        </div>
        <h1 style={{
          fontFamily: "Sora, sans-serif", fontWeight: 800,
          fontSize: "clamp(26px, 4vw, 38px)", color: "var(--text)", marginBottom: "10px",
        }}>
          Cultural Fit Map
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: "14px" }}>
          Select a movie to see its cultural alignment across the globe.
        </p>
      </div>

      {/* Movie selector */}
      {movies.length > 0 ? (
        <>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
              Select Movie
            </label>
            <select
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              style={{
                background: "var(--input-bg)", color: "var(--text)",
                border: "1.5px solid var(--border)", borderRadius: "11px",
                padding: "10px 16px", fontSize: "14px", fontWeight: 600,
                minWidth: "240px", outline: "none",
              }}
            >
              {movies.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              { color: "#22c55e", label: "8-10  Strong Fit" },
              { color: "#f59e0b", label: "6-7   Good Fit" },
              { color: "#f97316", label: "4-5   Weak Fit" },
              { color: "#ef4444", label: "1-3   Poor Fit" },
              { color: "#2a2d3e", label: "No data" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: color }} />
                <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Map */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", overflow: "hidden",
          }}>
            <ComposableMap projectionConfig={{ scale: 147 }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo) => {
                    const iso3   = geo.properties.ISO_A3 ?? geo.id;
                    const region = iso3ToRegion[iso3];
                    const score  = region ? (scoreMap[region] ?? null) : null;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={scoreToColor(score)}
                        stroke="var(--bg)"
                        strokeWidth={0.4}
                        style={{ hover: { opacity: 0.8, cursor: region ? "pointer" : "default" } }}
                        onMouseEnter={() => {
                          if (region) {
                            setTooltip(`${region}: ${score !== null ? `${score}/10` : "No data"}`);
                          }
                        }}
                        onMouseLeave={() => setTooltip("")}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
            {tooltip && (
              <div style={{
                textAlign: "center", padding: "8px",
                fontSize: "13px", fontWeight: 600, color: "var(--text-2)",
                borderTop: "1px solid var(--border)",
              }}>
                🌍 {tooltip}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: "center", color: "var(--text-3)", fontSize: "14px",
          padding: "60px 24px", border: "1px dashed var(--border)", borderRadius: "16px",
        }}>
          No analyses yet. Analyze a movie first, then come back to see the map.
        </div>
      )}
    </div>
  );
}