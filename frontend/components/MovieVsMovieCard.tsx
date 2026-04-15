"use client";
interface Side { title: string; score: number; label: string; reason: string; }
interface Props { region: string; movie_a: Side; movie_b: Side; }

export default function MovieVsMovieCard({ region, movie_a, movie_b }: Props) {
  const winner = movie_a.score >= movie_b.score ? "A" : "B";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "start" }}>

      {/* Movie A */}
      <MovieSideCard side={movie_a} highlight={winner === "A"} />

      {/* VS divider */}
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "8px",
        paddingTop:     "32px",
        color:          "var(--text-3)",
      }}>
        <span style={{ fontSize: "14px", fontWeight: 800 }}>VS</span>
        <span style={{ fontSize: "11px" }}>🌍 {region}</span>
      </div>

      {/* Movie B */}
      <MovieSideCard side={movie_b} highlight={winner === "B"} />
    </div>
  );
}

function MovieSideCard({ side, highlight }: { side: Side; highlight: boolean }) {
  return (
    <div style={{
      background:   highlight ? "var(--accent-dim)"  : "var(--bg-card)",
      border:       highlight ? "1.5px solid var(--accent)" : "1px solid var(--border)",
      borderRadius: "16px",
      padding:      "22px",
      textAlign:    "center",
    }}>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>
        {side.title}
      </p>
      <p style={{ fontSize: "36px", fontWeight: 800, color: highlight ? "var(--accent)" : "var(--text)", marginBottom: "4px" }}>
        {side.score}/10
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "12px" }}>
        {side.label}
      </p>
      {highlight && (
        <span style={{
          fontSize: "11px", fontWeight: 700,
          background: "var(--accent)", color: "#fff",
          borderRadius: "99px", padding: "3px 10px", display: "inline-block",
          marginBottom: "12px",
        }}>
          👑 Better Fit
        </span>
      )}
      <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>
        💬 {side.reason}
      </p>
    </div>
  );
}