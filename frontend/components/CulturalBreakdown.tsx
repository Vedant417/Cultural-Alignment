"use client";
import { useLanguage } from "@/hooks/useLanguage";

interface SubScores {
  cultural_fit:    number;
  censorship_risk: number;
  language_fit:    number;
  market_appeal:   number;
}

const BREAKDOWN_META = [
  { key: "cultural_fit",    labelKey: "cultural_fit",    icon: "🎭", invert: false },
  { key: "censorship_risk", labelKey: "censorship_risk",  icon: "🚫", invert: true  },
  { key: "language_fit",    labelKey: "language_fit",    icon: "🌍", invert: false },
  { key: "market_appeal",   labelKey: "market_appeal",   icon: "📈", invert: false },
] as const;

export default function CulturalBreakdown({ scores }: { scores: SubScores }) {
  const { t } = useLanguage();
  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap:                 "8px",
      marginTop:           "12px",
    }}>
      {BREAKDOWN_META.map(({ key, labelKey, icon, invert }) => {
        const raw      = scores[key];
        const display  = invert ? 10 - raw : raw;
        const warn     = invert && raw >= 7;
        const barColor = warn
          ? "var(--red)"
          : display >= 7 ? "var(--green)" : display >= 5 ? "var(--amber)" : "var(--orange)";

        return (
          <div key={key} style={{
            background:   "var(--bg-deep)",
            border:       warn ? "1px solid var(--red)" : "1px solid var(--border)",
            borderRadius: "10px",
            padding:      "10px 12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
                {icon} {t(labelKey as any)}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: barColor }}>
                {display}/10
              </span>
            </div>
            <div style={{ height: "3px", background: "var(--score-track)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                width:        `${(display / 10) * 100}%`,
                height:       "100%",
                background:   barColor,
                borderRadius: "2px",
                transition:   "width 0.6s ease",
              }} />
            </div>
            {warn && (
              <p style={{ fontSize: "10px", color: "var(--red)", marginTop: "5px" }}>
                {t("high_censorship")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}