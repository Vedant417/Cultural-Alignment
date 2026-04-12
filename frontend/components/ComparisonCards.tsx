"use client";
import { ComparisonEntry } from "@/types";

function scoreColor(score: number | null): string {
  if (score === null) return "#334155";
  if (score >= 8)    return "#10b981";
  if (score >= 6)    return "#f59e0b";
  if (score >= 4)    return "#f97316";
  return                    "#ef4444";
}

function scoreBg(score: number | null): string {
  if (score === null) return "#1e293b";
  if (score >= 8)    return "rgba(16,185,129,0.08)";
  if (score >= 6)    return "rgba(245,158,11,0.08)";
  if (score >= 4)    return "rgba(249,115,22,0.08)";
  return                    "rgba(239,68,68,0.08)";
}

function scoreBorder(score: number | null): string {
  if (score === null) return "#252d45";
  if (score >= 8)    return "rgba(16,185,129,0.25)";
  if (score >= 6)    return "rgba(245,158,11,0.25)";
  if (score >= 4)    return "rgba(249,115,22,0.25)";
  return                    "rgba(239,68,68,0.25)";
}

const COUNTRY_FLAGS: Record<string, string> = {
  "India": "🇮🇳", "Bangladesh": "🇧🇩", "Pakistan": "🇵🇰",
  "Japan": "🇯🇵", "South Korea": "🇰🇷", "China": "🇨🇳", "Singapore": "🇸🇬",
  "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹", "Spain": "🇪🇸",
  "United Kingdom": "🇬🇧", "Russia": "🇷🇺",
  "United States": "🇺🇸", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
  "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦", "Egypt": "🇪🇬",
  "Australia": "🇦🇺",
};

interface Props {
  entries:    ComparisonEntry[];
  movieTitle: string;
}

export default function ComparisonCards({ entries, movieTitle }: Props) {
  if (!entries.length) return null;

  const maxScore = Math.max(...entries.map((e) => e.score ?? 0), 1);

  return (
    <div>
      <p style={{
        fontSize: "11px", fontWeight: 700, color: "#8896b3",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px",
      }}>
        🌍 Cultural Fit Comparison — {movieTitle}
      </p>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[
          { color: "#10b981", label: "8–10  Strong / Perfect" },
          { color: "#f59e0b", label: "6–7  Good / Moderate" },
          { color: "#f97316", label: "4–5  Weak" },
          { color: "#ef4444", label: "1–3  Poor" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px",
                          background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#8896b3" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Country cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map((entry, idx) => {
          const color  = scoreColor(entry.score);
          const bg     = scoreBg(entry.score);
          const border = scoreBorder(entry.score);
          const flag   = COUNTRY_FLAGS[entry.region] ?? "🌐";
          const barPct = entry.score !== null ? (entry.score / 10) * 100 : 0;

          return (
            <div
              key={entry.region}
              style={{
                background:   bg,
                border:       `1px solid ${border}`,
                borderRadius: "12px",
                padding:      "14px 16px",
                position:     "relative",
                overflow:     "hidden",
              }}
            >
              {/* Rank badge */}
              <div style={{
                position:   "absolute",
                top:        "12px",
                right:      "14px",
                fontSize:   "11px",
                fontWeight: 700,
                color:      "#8896b3",
              }}>
                #{idx + 1}
              </div>

              {/* Top row: flag + country + score + label */}
              <div style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "10px",
                marginBottom:   "10px",
              }}>
                <span style={{ fontSize: "22px" }}>{flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize:   "15px",
                      fontWeight: 700,
                      color:      "#f0f4ff",
                      fontFamily: "Sora, sans-serif",
                    }}>
                      {entry.region}
                    </span>
                    {entry.cached && (
                      <span style={{
                        fontSize:     "10px",
                        color:        "#6366f1",
                        background:   "#1e1f4a",
                        border:       "1px solid #312e81",
                        borderRadius: "4px",
                        padding:      "1px 6px",
                      }}>
                        ⚡ cached
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                    fontWeight:   600,
                    color:        color,
                    background:   bg,
                    border:       `1px solid ${color}44`,
                    borderRadius: "99px",
                    padding:      "2px 8px",
                  }}>
                    {entry.label}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{
                height:       "4px",
                background:   "#1a1f30",
                borderRadius: "2px",
                marginBottom: "10px",
                overflow:     "hidden",
              }}>
                <div style={{
                  width:        `${barPct}%`,
                  height:       "100%",
                  background:   color,
                  borderRadius: "2px",
                  transition:   "width 0.6s ease",
                }} />
              </div>

              {/* AI reasoning */}
              {entry.reason && (
                <p style={{
                  fontSize:   "13px",
                  color:      "#a8b8d8",
                  lineHeight: 1.55,
                  margin:     0,
                  paddingLeft: "32px",
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