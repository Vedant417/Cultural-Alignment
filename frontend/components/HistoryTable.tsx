"use client";
import { AlignmentDocument } from "@/types";
import { deleteAnalysis } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

function scoreColor(score: number | null) {
  if (score === null) return "#8896b3";
  if (score >= 8)    return "#10b981";
  if (score >= 6)    return "#f59e0b";
  if (score >= 4)    return "#f97316";
  return                    "#ef4444";
}

export default function HistoryTable({ data: initial }: { data: AlignmentDocument[] }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const router          = useRouter();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    setBusy(id);
    await deleteAnalysis(id);
    setData((d) => d.filter((r) => r.id !== id));
    setBusy(null);
    router.refresh();
  };

  if (!data.length) {
    return (
      <div style={{
        background: "#141824", border: "1px solid #252d45", borderRadius: "16px",
        padding: "60px 24px", textAlign: "center", color: "#8896b3", fontSize: "14px",
      }}>
        No analyses yet. Go to <strong style={{ color: "#c8d3ea" }}>Analyze</strong> to get started.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", borderRadius: "16px", border: "1px solid #252d45" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ background: "#0d0f18", borderBottom: "1px solid #252d45" }}>
            {["Movie", "Target Region", "Score", "Label", "Date", ""].map((h) => (
              <th key={h} style={{
                padding: "14px 18px", textAlign: "left",
                fontSize: "11px", fontWeight: 700, color: "#8896b3",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => {}}
              style={{
                background:   "#141824",
                borderBottom: "1px solid #1a1f30",
                cursor:       "default",
                transition:   "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1f30")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#141824")}
            >
              <td style={{ padding: "14px 18px", fontWeight: 600, color: "#f0f4ff" }}>
                {row.movie.title}
              </td>
              <td style={{ padding: "14px 18px", color: "#8896b3" }}>
                {row.target_region}
              </td>
              <td style={{ padding: "14px 18px", fontWeight: 700,
                           color: scoreColor(row.result.score) }}>
                {row.result.score !== null ? `${row.result.score}/10` : "—"}
              </td>
              <td style={{ padding: "14px 18px", color: "#c8d3ea" }}>
                {row.result.label}
              </td>
              <td style={{ padding: "14px 18px", color: "#8896b3" }}>
                {new Date(row.searched_at).toLocaleDateString()}
              </td>
              <td style={{ padding: "14px 18px" }}>
                <button
                  onClick={(e) => handleDelete(row.id, e)}
                  disabled={busy === row.id}
                  style={{
                    background: "none", border: "none",
                    color: "#334155", cursor: busy === row.id ? "not-allowed" : "pointer",
                    fontSize: "16px", lineHeight: 1, padding: "4px",
                    opacity: busy === row.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
                  title="Delete"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}