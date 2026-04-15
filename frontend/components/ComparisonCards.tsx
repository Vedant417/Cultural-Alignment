"use client";
import { ComparisonEntry } from "@/types";

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-3)";
  if (score >= 8)    return "var(--green)";
  if (score >= 6)    return "var(--amber)";
  if (score >= 4)    return "var(--orange)";
  return                    "var(--red)";
}

function scoreBgVar(score: number | null): string {
  if (score === null) return "var(--bg-deep)";
  if (score >= 8)    return "var(--green-dim)";
  if (score >= 6)    return "var(--amber-dim)";
  if (score >= 4)    return "var(--orange-dim)";
  return                    "var(--red-dim)";
}

const COUNTRY_FLAGS: Record<string, string> = {
  "India":"🇮🇳","Bangladesh":"🇧🇩","Pakistan":"🇵🇰",
  "Japan":"🇯🇵","South Korea":"🇰🇷","China":"🇨🇳","Singapore":"🇸🇬",
  "France":"🇫🇷","Germany":"🇩🇪","Italy":"🇮🇹","Spain":"🇪🇸",
  "United Kingdom":"🇬🇧","Russia":"🇷🇺",
  "United States":"🇺🇸","Brazil":"🇧🇷","Mexico":"🇲🇽",
  "UAE":"🇦🇪","Saudi Arabia":"🇸🇦","Egypt":"🇪🇬","Australia":"🇦🇺",
};

interface Props {
  entries:    ComparisonEntry[];
  movieTitle: string;
}

export default function ComparisonCards({ entries, movieTitle }: Props) {
  if (!entries.length) return null;

  return (
    <div>
      {/* Header */}
      <p className="ca-label" style={{ marginBottom: "16px" }}>
        🌍 Cultural Fit Comparison — {movieTitle}
      </p>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[
          { color: "var(--green)",  label: "8–10  Strong / Perfect" },
          { color: "var(--amber)",  label: "6–7  Good / Moderate"   },
          { color: "var(--orange)", label: "4–5  Weak"               },
          { color: "var(--red)",    label: "1–3  Poor"               },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px",
                          background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map((entry, idx) => {
          const color   = scoreColor(entry.score);
          const bgColor = scoreBgVar(entry.score);
          const flag    = COUNTRY_FLAGS[entry.region] ?? "🌐";
          const barPct  = entry.score !== null ? (entry.score / 10) * 100 : 0;

          return (
            <div
              key={entry.region}
              style={{
                background:   bgColor,
                border:       `1px solid var(--border)`,
                borderRadius: "14px",
                padding:      "16px 18px",
                position:     "relative",
              }}
            >
              {/* Rank badge */}
              <span style={{
                position:   "absolute",
                top:        "14px",
                right:      "16px",
                fontSize:   "11px",
                fontWeight: 700,
                color:      "var(--text-3)",
              }}>
                #{idx + 1}
              </span>

              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px", flexShrink: 0 }}>{flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "Sora, sans-serif",
                      fontWeight: 700,
                      fontSize:   "15px",
                      color:      "var(--text)",
                    }}>
                      {entry.region}
                    </span>
                    {entry.cached && (
                      <span style={{
                        fontSize:     "10px",
                        color:        "var(--accent)",
                        background:   "var(--accent-dim)",
                        border:       "1px solid var(--accent-glow)",
                        borderRadius: "4px",
                        padding:      "1px 6px",
                        fontWeight:   700,
                      }}>
                        ⚡ cached
                      </span>
                    )}
                  </div>
                </div>
                {/* Score + label */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{
                    fontSize:   "20px",
                    fontWeight: 800,
                    color:      color,
                    fontFamily: "Sora, sans-serif",
                  }}>
                    {entry.score !== null ? `${entry.score}/10` : "—"}
                  </span>
                  <span style={{
                    fontSize:     "11px",
                    fontWeight:   700,
                    color:        color,
                    border:       `1px solid ${color}44`,
                    borderRadius: "99px",
                    padding:      "2px 9px",
                    background:   bgColor,
                  }}>
                    {entry.label}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{
                height:       "4px",
                background:   "var(--score-track)",
                borderRadius: "2px",
                marginBottom: "10px",
                overflow:     "hidden",
              }}>
                <div style={{
                  width:      `${barPct}%`,
                  height:     "100%",
                  background: color,
                  borderRadius: "2px",
                  transition: "width 0.6s ease",
                }} />
              </div>

              {/* AI reasoning */}
              {entry.reason && (
                <p style={{
                  fontSize:   "13px",
                  color:      "var(--text-2)",
                  lineHeight: 1.6,
                  margin:     0,
                  paddingLeft:"36px",
                }}>
                  💬 {entry.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}