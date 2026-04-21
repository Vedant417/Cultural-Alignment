import { useState, KeyboardEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onAnalyze: (movie: string) => void;
  loading:   boolean;
}

export default function SearchBar({ onAnalyze, loading }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim()) onAnalyze(value.trim());
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex gap-3 w-full max-w-2xl">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
        <input
          type="text"
          className="w-full bg-[#1e2130] border border-[#2d3348] rounded-xl pl-11 pr-4 py-3.5
                     text-slate-100 placeholder-slate-600 text-sm
                     focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                     transition-all disabled:opacity-50"
          placeholder="Title, TMDb link, or IMDb link…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          disabled={loading}
        />
      </div>
      <button
        onClick={submit}
        disabled={loading || !value.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   disabled:opacity-40 disabled:cursor-not-allowed
                   text-white font-semibold px-6 py-3.5 rounded-xl
                   flex items-center gap-2 transition-all text-sm whitespace-nowrap"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          : <><Search  className="w-4 h-4" />               Analyze</>
        }
      </button>
    </div>
  );
}