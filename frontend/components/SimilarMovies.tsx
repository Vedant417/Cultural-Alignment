import { SimilarMovie } from "@/types";
import { Film } from "lucide-react";

export default function SimilarMovies({ movies }: { movies: SimilarMovie[] }) {
  if (!movies.length) return null;
  return (
    <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        🍿 You Might Also Like
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {movies.slice(0, 3).map((m, i) => (
          <div
            key={i}
            className="bg-[#161926] border border-[#2d3348] rounded-xl p-3.5 space-y-2"
          >
            <div className="flex items-start gap-2">
              <Film className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-slate-200 leading-tight">{m.title}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-5">{m.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}