import { AnalysisResult } from "@/types";

function scoreStyle(score: number | null) {
  if (score === null) return {
    badge: "bg-slate-700",
    pill:  "bg-slate-800 text-slate-300 border-slate-600",
    glow:  "",
  };
  if (score >= 7) return {
    badge: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    pill:  "bg-emerald-950 text-emerald-400 border-emerald-700",
    glow:  "shadow-[0_0_24px_rgba(16,185,129,0.3)]",
  };
  if (score >= 4) return {
    badge: "bg-gradient-to-br from-amber-500 to-amber-700",
    pill:  "bg-amber-950 text-amber-400 border-amber-700",
    glow:  "shadow-[0_0_24px_rgba(245,158,11,0.3)]",
  };
  return {
    badge: "bg-gradient-to-br from-red-500 to-red-700",
    pill:  "bg-red-950 text-red-400 border-red-700",
    glow:  "shadow-[0_0_24px_rgba(239,68,68,0.3)]",
  };
}

interface Props {
  result: AnalysisResult;
  region: string;
}

export default function ScoreBadge({ result, region }: Props) {
  const { score, label, reason, audience_note } = result;
  const s = scoreStyle(score);

  return (
    <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl overflow-hidden">

      {/* ── Score / Label / Region row ── */}
      <div className="grid grid-cols-3 divide-x divide-[#2d3348] border-b border-[#2d3348]">

        <Cell label="Score">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center
                           text-white font-extrabold text-lg ${s.badge} ${s.glow}`}
               style={{ fontFamily: "var(--font-sora), sans-serif" }}>
            {score !== null ? `${score}/10` : "—"}
          </div>
        </Cell>

        <Cell label="Alignment">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.pill}`}>
            {label || "Unknown"}
          </span>
        </Cell>

        <Cell label="Region">
          <span className="text-sm font-bold text-slate-200 text-center px-2"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}>
            {region || "Unknown"}
          </span>
        </Cell>

      </div>

      {/* ── Analysis reason ── */}
      <div className="p-5 border-b border-[#2d3348]">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Analysis
        </p>
        <div className="border-l-4 border-indigo-500 pl-4 py-3 pr-3
                        bg-[#161926] rounded-r-xl text-slate-300 text-sm leading-relaxed">
          {reason || "No analysis available."}
        </div>
      </div>

      {/* ── Audience note ── */}
      {audience_note && (
        <div className="px-5 pb-5 pt-4">
          <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl
                          px-4 py-3 text-sm text-indigo-300 italic leading-relaxed">
            👥 {audience_note}
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3 px-2">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      {children}
    </div>
  );
}