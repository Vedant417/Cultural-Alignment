"use client";
import { useState }      from "react";
import { useLanguage }   from "@/hooks/useLanguage";
import TranslatedText    from "@/components/TranslatedText";

interface DeepAnalysis {
  language:   string;
  religion:   string;
  censorship: string;
  audience:   string;
  context:    string;
}

interface Props {
  title:   string;
  region:  string;
  summary: string;
}

type State = "idle" | "loading" | "done" | "error";

const FACTOR_KEYS = ["language","religion","censorship","audience","context"] as const;
const FACTOR_ICON: Record<string, string> = {
  language:   "🗣️",
  religion:   "🙏",
  censorship: "🚫",
  audience:   "🎭",
  context:    "🏛️",
};
const FACTOR_LABEL_KEY: Record<string, string> = {
  language:   "factor_language",
  religion:   "factor_religion",
  censorship: "factor_censorship",
  audience:   "factor_audience",
  context:    "factor_context",
};

export default function ExplainMoreBtn({ title, region, summary }: Props) {
  const { t, translateAsync }           = useLanguage();
  const [open,  setOpen]            = useState(false);
  const [state, setState]           = useState<State>("idle");
  const [data,  setData]            = useState<DeepAnalysis | null>(null);

  const doFetch = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/analyze/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, region, summary }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();

      // Strip possible ```json fences before parsing
      const clean  = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(clean) as DeepAnalysis;

      // Validate expected keys exist
      if (!parsed.language && !parsed.religion) throw new Error("Unexpected response shape");

      setData(parsed);
      setState("done");
    } catch (err) {
      console.error("ExplainMore error:", err);
      setState("error");
    }
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      // Only fetch if we haven't successfully fetched yet
      if (state === "idle" || state === "error") {
        doFetch();
      }
    } else {
      setOpen(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");
    doFetch();
  };

  return (
    <div style={{ marginTop: "10px" }}>
      {/* Toggle button — always shows, always has a defined label */}
      <button
        onClick={handleToggle}
        style={{
          fontSize:     "12px",
          fontWeight:   700,
          color:        "var(--accent)",
          background:   "var(--accent-dim)",
          border:       "1px solid var(--accent-glow)",
          borderRadius: "8px",
          padding:      "5px 12px",
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          gap:          "4px",
        }}
      >
        {open ? t("explain_collapse") : t("explain_btn")}
      </button>

      {/* Expandable panel — only renders when open */}
      {open && (
        <div style={{
          marginTop:    "12px",
          background:   "var(--bg-deep)",
          border:       "1px solid var(--border)",
          borderRadius: "12px",
          padding:      "16px",
        }}>

          {/* LOADING state */}
          {state === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "16px", height: "16px",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite",
                flexShrink: 0,
              }} />
              <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>
                {t("explain_loading")}
              </p>
            </div>
          )}

          {/* ERROR state — always has close + retry */}
          {state === "error" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "13px", color: "var(--red)", margin: 0 }}>
                ❌ {t("explain_error")}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleRetry} style={{
                  fontSize: "12px", fontWeight: 700, color: "var(--accent)",
                  background: "var(--accent-dim)", border: "1px solid var(--accent-glow)",
                  borderRadius: "7px", padding: "4px 12px", cursor: "pointer",
                }}>
                  🔄 {t("explain_retry")}
                </button>
                <button onClick={() => setOpen(false)} style={{
                  fontSize: "12px", fontWeight: 700, color: "var(--text-3)",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "7px", padding: "4px 12px", cursor: "pointer",
                }}>
                  ✕ {t("close_btn")}
                </button>
              </div>
            </div>
          )}

          {/* DONE state */}
          {state === "done" && data && (
            <div>
              {FACTOR_KEYS.map((key) => (
                <div key={key} style={{ marginBottom: "14px" }}>
                  <p style={{
                    fontSize: "12px", fontWeight: 700,
                    color: "var(--text)", marginBottom: "4px", display: "flex",
                    alignItems: "center", gap: "6px",
                  }}>
                    <span>{FACTOR_ICON[key]}</span>
                    {t(FACTOR_LABEL_KEY[key])}
                  </p>
                  <TranslatedText
                    text={data[key]}
                    variant="body"
                    showSkeleton={false}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}