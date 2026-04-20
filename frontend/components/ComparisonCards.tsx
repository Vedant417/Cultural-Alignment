"use client";
import { ComparisonEntry } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import ExplainMoreBtn from "@/components/ExplainMoreBtn";
import TranslatedText from "@/components/TranslatedText";
import CulturalBreakdown from "@/components/CulturalBreakdown";
import ScoreTrendChart from "@/components/ScoreTrendChart";

// Helper to format cache timestamp into a readable relative time
function formatTimeDiff(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "just now";
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

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
  entries: ComparisonEntry[];
  movieTitle: string;
}

export default function ComparisonCards({ entries, movieTitle }: Props) {
  const { t } = useLanguage();
  if (!entries.length) return null;

  return (
    <div>
      <p className="ca-label" style={{ marginBottom: "16px" }}>
        🌍 {t("comparison_header")}
      </p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[
          { color: "var(--green)",  label: t("score_range_high") },
          { color: "var(--amber)",  label: t("score_range_good")   },
          { color: "var(--orange)", label: t("score_range_weak")               },
          { color: "var(--red)",    label: t("score_range_poor")               },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px",
                          background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{label}</span>
          </div>
        ))}
      </div>

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
                    
                    {/* ✅ Enhanced cache/live indicator */}
                    {entry.cached ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{
                          fontSize: "10px", color: "var(--accent)",
                          background: "var(--accent-dim)", border: "1px solid var(--accent-glow)",
                          borderRadius: "4px", padding: "1px 6px", fontWeight: 700,
                        }}>
                          ⚡ cached
                        </span>
                       {(entry as any).cached_at && (
  <span style={{ fontSize: "9px", color: "var(--text-3)" }}>
    {formatTimeDiff((entry as any).cached_at)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{
                        fontSize: "10px", color: "var(--green)",
                        background: "var(--green-dim)", border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: "4px", padding: "1px 6px", fontWeight: 700,
                      }}>
                        🆕 fresh
                      </span>
                    )}
                  </div>
                </div>

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

              {/* ✅ Cultural Breakdown */}
              {entry.sub_scores && (
                <CulturalBreakdown scores={entry.sub_scores} />
              )}

              {/* AI reasoning */}
              {entry.reason && (
                <div style={{ paddingLeft: "36px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>💬</span>
                    <div style={{ flex: 1 }}>
                      <TranslatedText
                        text={entry.reason}
                        variant="body"
                        showSkeleton={true}
                      />
                      <ExplainMoreBtn
                        title={movieTitle}
                        region={entry.region}
                        summary={entry.reason}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ Score Trend Chart — visual comparison across regions */}
      <div style={{ marginTop: "24px" }}>
        <ScoreTrendChart movieTitle={movieTitle} entries={entries} />
      </div>
      
    </div>
  );
}