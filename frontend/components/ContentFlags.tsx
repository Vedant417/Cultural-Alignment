import { ContentFlags as FlagsType } from "@/types";

type Level = FlagsType[keyof FlagsType];

const STYLES: Record<Level, string> = {
  None:     "bg-emerald-950 text-emerald-400 border-emerald-900",
  Low:      "bg-emerald-950 text-emerald-400 border-emerald-900",
  Mild:     "bg-amber-950  text-amber-400  border-amber-900",
  Moderate: "bg-orange-950 text-orange-400 border-orange-900",
  High:     "bg-red-950    text-red-400    border-red-900",
};

const FLAGS: { key: keyof FlagsType; label: string }[] = [
  { key: "violence",             label: "⚔️ Violence" },
  { key: "adult_content",        label: "🔞 Adult Content" },
  { key: "religion_sensitivity", label: "🕌 Religion" },
  { key: "drug_glorification",   label: "💊 Drug Glorification" },
];

export default function ContentFlags({ flags }: { flags: FlagsType }) {
  return (
    <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        Content Flags
      </p>
      <div className="flex flex-wrap gap-2">
        {FLAGS.map(({ key, label }) => {
          const level = (flags[key] ?? "None") as Level;
          const cls = STYLES[level] ?? STYLES.None;
          return (
            <span key={key}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${cls}`}>
              {label}: {level}
            </span>
          );
        })}
      </div>
    </div>
  );
}