"use client";
import { useState } from "react";

interface DeepAnalysis {
  language: string; religion: string; censorship: string;
  audience: string; context: string;
}

interface Props { title: string; region: string; summary: string; }

const FACTOR_ICONS: Record<keyof DeepAnalysis, string> = {
  language:   "🗣️",
  religion:   "🙏",
  censorship: "🚫",
  audience:   "🎭",
  context:    "🏛️",
};

const FACTOR_LABELS: Record<keyof DeepAnalysis, string> = {
  language:   "Language & Dialogue",
  religion:   "Religion & Values",
  censorship: "Censorship Risk",
  audience:   "Audience Taste",
  context:    "Historical / Political Context",
};

export default function ExplainMoreBtn({ title, region, summary }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState<DeepAnalysis | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    if (data) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res  = await fetch("/api/analyze/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, region, summary }),
      });
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not load deep analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={load}
        style={{
          fontSize:     "12px",
          fontWeight:   700,
          color:        "var(--accent)",
          background:   "var(--accent-dim)",
          border:       "1px solid var(--accent-glow)",
          borderRadius: "8px",
          padding:      "5px 12px",
          cursor:       "pointer",
        }}
      >
        {open ? "▲ Collapse" : "🔍 Explain deeper →"}
      </button>

      {open && (
        <div style={{
          marginTop:    "14px",
          background:   "var(--bg-deep)",
          border:       "1px solid var(--border)",
          borderRadius: "12px",
          padding:      "16px",
        }}>
          {loading && <p style={{ color: "var(--text-3)", fontSize: "13px" }}>Analyzing cultural factors…</p>}
          {error   && <p style={{ color: "var(--red)",    fontSize: "13px" }}>{error}</p>}
          {data && (Object.keys(FACTOR_ICONS) as Array<keyof DeepAnalysis>).map((key) => (
            <div key={key} style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                {FACTOR_ICONS[key]} {FACTOR_LABELS[key]}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.65 }}>
                {data[key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}