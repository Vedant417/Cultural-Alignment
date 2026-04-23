"use client";
import { useState } from "react";

interface Rec { title: string; reason: string; expected_score: number; }
interface Props { currentTitle: string; region: string; score: number; }

export default function RecommendationRow({ currentTitle, region, score }: Props) {
  const [recs,    setRecs]    = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (recs) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/analyze/recommend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: currentTitle, region, score }),
      });
      const data = await res.json();
      setRecs(data.recommendations || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {!recs && !loading && (
        <button onClick={load} style={{
          fontSize: "13px", fontWeight: 700,
          background: "var(--bg-deep)", color: "var(--text-2)",
          border: "1px solid var(--border)", borderRadius: "10px",
          padding: "8px 16px", cursor: "pointer",
        }}>
          🎬 Get Recommendations for {region}
        </button>
      )}

      {loading && <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Finding similar movies…</p>}

      {recs && (
        <div>
          <p className="ca-label" style={{ marginBottom: "12px" }}>
            If you liked {currentTitle}, also analyze:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {recs.map((r) => (
              <div key={r.title} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "12px 16px", maxWidth: "220px",
              }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                  {r.title}
                </p>
                <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, marginBottom: "6px" }}>
                  ~{r.expected_score}/10 expected
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>
                  {r.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}