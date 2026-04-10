import { AlignmentDocument } from "@/types";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAnalysis } from "@/lib/api";
import { useState } from "react";

export default function HistoryTable({ data: initial }: { data: AlignmentDocument[] }) {
  const router = useRouter();
  const [data, setData]   = useState(initial);
  const [busy, setBusy]   = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    setBusy(id);
    await deleteAnalysis(id);
    setData((d) => d.filter((row) => row.id !== id));
    setBusy(null);
    router.refresh();
  };

  if (!data.length) {
    return (
      <div className="text-center text-slate-500 py-20 text-sm bg-[#1e2130] border border-[#2d3348] rounded-2xl">
        No analyses yet. Go to <strong className="text-slate-400">Analyze</strong> and search for a movie.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#2d3348]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161926] text-xs text-slate-500 uppercase tracking-widest border-b border-[#2d3348]">
            <th className="px-5 py-4 text-left">Movie</th>
            <th className="px-5 py-4 text-left">Region</th>
            <th className="px-5 py-4 text-left">Score</th>
            <th className="px-5 py-4 text-left">Alignment</th>
            <th className="px-5 py-4 text-left">Date</th>
            <th className="px-5 py-4 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2d3348]">
          {data.map((row) => {
            const score = row.result.score;
            const scoreColor =
              score === null   ? "text-slate-400" :
              score >= 7       ? "text-emerald-400" :
              score >= 4       ? "text-amber-400"   :
                                 "text-red-400";
            return (
              <tr
                key={row.id}
                onClick={() => router.push(`/?id=${row.id}`)}
                className="bg-[#1e2130] hover:bg-[#252a3d] cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 font-semibold text-slate-100">
                  {row.movie.title}
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {row.region.region}
                </td>
                <td className={`px-5 py-4 font-bold ${scoreColor}`}>
                  {score !== null ? `${score}/10` : "—"}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {row.result.label}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {new Date(row.searched_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={(e) => handleDelete(row.id, e)}
                    disabled={busy === row.id}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}