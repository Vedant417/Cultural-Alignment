"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

type HistoryEntry = {
  id: string;
  target_region: string;
  score: number | null;
  label: string;
  reason: string;
  searched_at: string;
  cached?: boolean;
};

type GroupedHistory = {
  title: string;
  poster_url: string;
  language: string;
  release_date: string;
  latest_date: string;
  entries: HistoryEntry[];
};

function scoreColor(score: number | null) {
  if (score === null) return "var(--text-3)";
  if (score >= 8) return "var(--green)";
  if (score >= 6) return "var(--amber)";
  if (score >= 4) return "var(--orange)";
  return "var(--red)";
}

function scoreBg(score: number | null) {
  if (score === null) return "var(--bg-deep)";
  if (score >= 8) return "var(--green-dim)";
  if (score >= 6) return "var(--amber-dim)";
  if (score >= 4) return "var(--orange-dim)";
  return "var(--red-dim)";
}

export default function HistoryTable({ data }: { data: GroupedHistory[] }) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const router = useRouter();

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const tooltip = document.getElementById("global-tooltip");
    if (!tooltip) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    tooltip.style.top = `${rect.top - 12}px`;
    tooltip.style.left = `${rect.left + 20}px`;
    tooltip.style.opacity = "1";

    tooltip.innerHTML = `
      <b style="color:white;">💬 Reason</b>
      <div style="margin-top:6px;line-height:1.5;">
        ${text}
      </div>
    `;
  };

  const hideTooltip = () => {
    const tooltip = document.getElementById("global-tooltip");
    if (tooltip) tooltip.style.opacity = "0";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {data.map((movie, i) => {
        const isOpen = openIndex === i;

        const best = movie.entries.reduce((a, b) =>
          (b.score ?? 0) > (a.score ?? 0) ? b : a
        );

        return (
          <div
            key={movie.title}
            className="ca-card"
            style={{
              padding: "16px 18px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img
                src={movie.poster_url}
                alt={movie.title}
                style={{
                  width: "50px",
                  height: "74px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  marginBottom: "3px"
                }}>
                  {movie.title}
                </div>

                <div style={{
                  fontSize: "13px",
                  color: "var(--text-2)"
                }}>
                  {movie.entries.length} {t("expand_countries")}
                </div>
              </div>

              {/* BEST BADGE */}
              <div style={{
                fontSize: "12px",
                fontWeight: 700,
                color: scoreColor(best.score),
                background: scoreBg(best.score),
                borderRadius: "999px",
                padding: "4px 10px",
              }}>
                {t("sort_highest")}: {best.score}/10 {best.target_region}
              </div>

              <div style={{
                fontSize: "16px",
                color: "var(--text-3)"
              }}>
                {isOpen ? "▲" : "▼"}
              </div>
            </div>

            {/* EXPAND */}
            {isOpen && (
              <div style={{ marginTop: "14px" }}>
                {movie.entries.map((entry) => {
                  const color = scoreColor(entry.score);
                  const width = entry.score ? (entry.score / 10) * 100 : 0;

                  return (
                    <div
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/analyze?title=${encodeURIComponent(movie.title)}&region=${encodeURIComponent(entry.target_region)}`
                        );
                      }}
                      style={{
                        padding: "12px 10px",
                        borderTop: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      {/* TOP */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px"
                      }}>
                        <span style={{ fontWeight: 600 }}>
                          {entry.target_region}
                        </span>

                        <span style={{
                          color,
                          fontWeight: 700
                        }}>
                          {entry.score}/10
                        </span>
                      </div>

                      {/* BAR */}
                      <div style={{
                        height: "4px",
                        background: "var(--score-track)",
                        borderRadius: "2px",
                        overflow: "hidden",
                        marginBottom: "6px"
                      }}>
                        <div style={{
                          width: `${width}%`,
                          height: "100%",
                          background: color,
                        }} />
                      </div>

                      {/* HOVER TEXT */}
                      <div
                        onMouseEnter={(e) => showTooltip(e, entry.reason)}
                        onMouseLeave={hideTooltip}
                        style={{
                          fontSize: "12px",
                          color: "var(--text-3)",
                        }}
                      >
                        💬 {t("ai_reasoning")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}