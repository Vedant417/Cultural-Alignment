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
    <div
      className="ca-card"
      style={{
        width: "100%",
        maxWidth: "980px",
        padding: "14px",
        display: "flex",
        gap: "14px",
        alignItems: "center",
        borderRadius: "22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08), transparent 45%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flex: 1,
          position: "relative",
        }}
      >
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2"
          style={{
            color: "var(--accent)",
            width: "18px",
            height: "18px",
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          disabled={loading}
          placeholder="Search movie, TMDB link, or IMDb link..."
          className="ca-input"
          style={{
            paddingLeft: "52px",
            height: "62px",
            fontSize: "15px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading || !value.trim()}
        className="ca-btn-primary"
        style={{
          height: "62px",
          padding: "0 30px",
          borderRadius: "18px",
          fontSize: "15px",
          fontWeight: 800,
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Analyze
          </>
        )}
      </button>
    </div>
  );
}