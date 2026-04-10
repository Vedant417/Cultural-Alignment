import { AnalysisResult } from "@/types";

function getStyle(score: number | null) {
  if (score === null) return {
    badge: { background: "#334155" },
    pill:  { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" },
  };
  if (score >= 8) return {
    badge: { background: "linear-gradient(135deg,#10b981,#059669)",
             boxShadow: "0 4px 20px rgba(16,185,129,0.35)" },
    pill:  { background: "#064e3b", color: "#6ee7b7", border: "1px solid #10b981" },
  };
  if (score >= 6) return {
    badge: { background: "linear-gradient(135deg,#f59e0b,#d97706)",
             boxShadow: "0 4px 20px rgba(245,158,11,0.35)" },
    pill:  { background: "#451a03", color: "#fcd34d", border: "1px solid #f59e0b" },
  };
  if (score >= 4) return {
    badge: { background: "linear-gradient(135deg,#f97316,#ea580c)",
             boxShadow: "0 4px 20px rgba(249,115,22,0.35)" },
    pill:  { background: "#431407", color: "#fdba74", border: "1px solid #f97316" },
  };
  return {
    badge: { background: "linear-gradient(135deg,#ef4444,#dc2626)",
             boxShadow: "0 4px 20px rgba(239,68,68,0.35)" },
    pill:  { background: "#450a0a", color: "#fca5a5", border: "1px solid #ef4444" },
  };
}

export default function ScoreBadge({
  result,
  targetRegion,
  cached,
}: {
  result:       AnalysisResult;
  targetRegion: string;
  cached?:      boolean;
}) {
  const { score, label, reason, audience_note } = result;
  const s = getStyle(score);

  return (
    <div style={{ background: "#141824", border: "1px solid #252d45", borderRadius: "16px", overflow: "hidden" }}>

      {/* ── Top row: Score / Alignment / Region ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    borderBottom: "1px solid #252d45" }}>
        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", padding: "24px 8px", gap: "10px",
                      borderRight: "1px solid #252d45" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>Score</p>
          <div style={{
            ...s.badge,
            width: "68px", height: "68px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "18px", color: "#fff",
          }}>
            {score !== null ? `${score}/10` : "—"}
          </div>
          {cached && (
            <span style={{ fontSize: "10px", color: "#6366f1", background: "#1e1f4a",
                           border: "1px solid #312e81", borderRadius: "4px", padding: "1px 6px" }}>
              cached
            </span>
          )}
        </div>

        {/* Alignment */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", padding: "24px 8px", gap: "10px",
                      borderRight: "1px solid #252d45" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>Alignment</p>
          <span style={{
            ...s.pill,
            padding: "4px 12px", borderRadius: "99px",
            fontSize: "12px", fontWeight: 700,
          }}>
            {label || "Unknown"}
          </span>
        </div>

        {/* Region */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", padding: "24px 8px", gap: "10px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>Region</p>
          <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "13px",
                         color: "#f0f4ff", textAlign: "center" }}>
            {targetRegion}
          </span>
        </div>
      </div>

      {/* ── Reason ── */}
      <div style={{ padding: "20px", borderBottom: "1px solid #252d45" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
          Analysis
        </p>
        <div style={{
          borderLeft: "3px solid #6366f1", paddingLeft: "14px", paddingTop: "10px",
          paddingBottom: "10px", paddingRight: "12px",
          background: "#0d0f18", borderRadius: "0 10px 10px 0",
          fontSize: "14px", color: "#c8d3ea", lineHeight: 1.7,
        }}>
          {reason || "No analysis available."}
        </div>
      </div>

      {/* ── Audience note ── */}
      {audience_note && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "10px", padding: "12px 14px",
            fontSize: "13px", color: "#a5b4fc", fontStyle: "italic", lineHeight: 1.6,
          }}>
            👥 {audience_note}
          </div>
        </div>
      )}
    </div>
  );
}