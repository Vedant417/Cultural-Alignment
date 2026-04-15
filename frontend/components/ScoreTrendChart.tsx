"use client";

interface DataPoint { region: string; score: number; flag: string; }

const COUNTRY_FLAGS: Record<string, string> = {
  "India":"🇮🇳","Bangladesh":"🇧🇩","Pakistan":"🇵🇰",
  "Japan":"🇯🇵","South Korea":"🇰🇷","China":"🇨🇳","Singapore":"🇸🇬",
  "France":"🇫🇷","Germany":"🇩🇪","Italy":"🇮🇹","Spain":"🇪🇸",
  "United Kingdom":"🇬🇧","Russia":"🇷🇺","United States":"🇺🇸",
  "Brazil":"🇧🇷","Mexico":"🇲🇽","UAE":"🇦🇪","Saudi Arabia":"🇸🇦",
  "Egypt":"🇪🇬","Australia":"🇦🇺",
};

function scoreColor(score: number): string {
  if (score >= 8) return "var(--green)";
  if (score >= 6) return "var(--amber)";
  if (score >= 4) return "var(--orange)";
  return "var(--red)";
}

interface Props { movieTitle: string; entries: { region: string; score: number | null }[]; }

export default function ScoreTrendChart({ movieTitle, entries }: Props) {
  const data: DataPoint[] = entries
    .filter((e) => e.score !== null)
    .map((e) => ({ region: e.region, score: e.score as number, flag: COUNTRY_FLAGS[e.region] ?? "🌐" }))
    .sort((a, b) => b.score - a.score);

  if (data.length < 2) return null;

  const maxScore = 10;

  return (
    <div style={{ marginTop: "28px" }}>
      <p className="ca-label" style={{ marginBottom: "14px" }}>
        📊 Score Trend — {movieTitle}
      </p>
      <div className="ca-card" style={{ padding: "20px" }}>
        {data.map((d) => (
          <div key={d.region} style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "10px",
            marginBottom:  "10px",
          }}>
            {/* Label */}
            <span style={{ fontSize: "16px", flexShrink: 0 }}>{d.flag}</span>
            <span style={{
              fontSize: "12px", fontWeight: 600,
              color: "var(--text-2)", width: "130px", flexShrink: 0,
            }}>
              {d.region}
            </span>

            {/* Bar */}
            <div style={{ flex: 1, height: "10px", background: "var(--score-track)",
              borderRadius: "5px", overflow: "hidden" }}>
              <div style={{
                width:        `${(d.score / maxScore) * 100}%`,
                height:       "100%",
                background:   scoreColor(d.score),
                borderRadius: "5px",
                transition:   "width 0.7s ease",
              }} />
            </div>

            {/* Score */}
            <span style={{
              fontSize: "13px", fontWeight: 800,
              color: scoreColor(d.score), width: "36px",
              flexShrink: 0, textAlign: "right",
            }}>
              {d.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}