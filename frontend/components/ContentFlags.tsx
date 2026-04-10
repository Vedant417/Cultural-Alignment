import { ContentFlags as FT } from "@/types";

const STYLES: Record<string, { bg: string; color: string; border: string }> = {
  None:     { bg: "#064e3b", color: "#6ee7b7", border: "#10b981" },
  Low:      { bg: "#064e3b", color: "#6ee7b7", border: "#10b981" },
  Mild:     { bg: "#451a03", color: "#fcd34d", border: "#f59e0b" },
  Moderate: { bg: "#431407", color: "#fdba74", border: "#f97316" },
  High:     { bg: "#450a0a", color: "#fca5a5", border: "#ef4444" },
};

const FLAGS: { key: keyof FT; label: string }[] = [
  { key: "violence",             label: "⚔️ Violence" },
  { key: "adult_content",        label: "🔞 Adult Content" },
  { key: "religion_sensitivity", label: "🕌 Religion" },
  { key: "drug_glorification",   label: "💊 Drug Glorification" },
];

export default function ContentFlags({ flags }: { flags: FT }) {
  return (
    <div style={{ background: "#141824", border: "1px solid #252d45",
                  borderRadius: "16px", padding: "20px" }}>
      <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
        Content Flags
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {FLAGS.map(({ key, label }) => {
          const level = flags[key] as string || "None";
          const style = STYLES[level] ?? STYLES["None"];
          return (
            <span key={key} style={{
              background:   style.bg,
              color:        style.color,
              border:       `1px solid ${style.border}`,
              borderRadius: "99px",
              padding:      "4px 12px",
              fontSize:     "12px",
              fontWeight:   600,
            }}>
              {label}: {level}
            </span>
          );
        })}
      </div>
    </div>
  );
}