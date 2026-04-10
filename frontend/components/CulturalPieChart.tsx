"use client";
import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { RegionScore } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

function scoreColor(score: number | null): string {
  if (score === null) return "#334155";
  if (score >= 8)    return "#10b981";   // emerald
  if (score >= 6)    return "#f59e0b";   // amber
  if (score >= 4)    return "#f97316";   // orange
  return                    "#ef4444";   // red
}

interface Props {
  scores:     RegionScore[];
  movieTitle: string;
}

export default function CulturalPieChart({ scores, movieTitle }: Props) {
  const validScores = scores.filter((s) => s.score !== null);

  if (validScores.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#8896b3", padding: "40px 0" }}>
        No scores available to chart.
      </div>
    );
  }

  const data: ChartData<"pie"> = {
    labels:   validScores.map((s) => `${s.region} (${s.score}/10)`),
    datasets: [{
      data:            validScores.map((s) => s.score ?? 0),
      backgroundColor: validScores.map((s) => scoreColor(s.score)),
      borderColor:     validScores.map(() => "#0d0f18"),
      borderWidth:     2,
      hoverOffset:     8,
    }],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color:     "#8896b3",
          font:      { size: 12, family: "Inter, sans-serif" },
          padding:   14,
          boxWidth:  14,
          boxHeight: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; raw: unknown; dataIndex: number }) => {
            const entry = validScores[ctx.dataIndex];
            return [
              ` Score: ${entry.score}/10`,
              ` Fit: ${entry.label}`,
              entry.cached ? " (cached)" : " (fresh)",
            ];
          },
        },
        backgroundColor: "#1a1f30",
        borderColor:     "#252d45",
        borderWidth:     1,
        titleColor:      "#f0f4ff",
        bodyColor:       "#8896b3",
        padding:         12,
      },
    },
  };

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#8896b3",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
        🌍 Cultural Fit Distribution — {movieTitle}
      </p>

      {/* Legend: color meaning */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[
          { color: "#10b981", label: "8–10 Strong/Perfect" },
          { color: "#f59e0b", label: "6–7 Good/Moderate" },
          { color: "#f97316", label: "4–5 Weak" },
          { color: "#ef4444", label: "1–3 Poor" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px",
                          backgroundColor: color, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#8896b3" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: "380px", margin: "0 auto" }}>
        <Pie data={data} options={options} />
      </div>

      {/* Score table below chart */}
      <div style={{ marginTop: "24px" }}>
        {validScores
          .slice()
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((s) => (
            <div key={s.region} style={{
              display:       "flex",
              alignItems:    "center",
              justifyContent:"space-between",
              padding:       "10px 14px",
              borderRadius:  "8px",
              background:    "#141824",
              border:        "1px solid #252d45",
              marginBottom:  "6px",
            }}>
              <span style={{ fontSize: "14px", color: "#c8d3ea" }}>{s.region}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {s.cached && (
                  <span style={{ fontSize: "10px", color: "#6366f1",
                                 background: "#1e1f4a", border: "1px solid #312e81",
                                 borderRadius: "4px", padding: "1px 6px" }}>
                    cached
                  </span>
                )}
                <span style={{ fontSize: "13px", fontWeight: 700,
                               color: scoreColor(s.score) }}>
                  {s.score}/10
                </span>
                <span style={{ fontSize: "12px", color: "#8896b3" }}>{s.label}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}