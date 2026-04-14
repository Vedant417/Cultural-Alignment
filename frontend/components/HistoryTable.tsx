"use client";
import { GroupedHistory, HistoryEntry } from "@/types";
import { deleteAnalysis }               from "@/lib/api";
import { useRouter }                    from "next/navigation";
import { useState, useRef }             from "react";

// ── Score helpers ─────────────────────────────────────────────────
function scoreColor(s: number | null) {
  if (s === null) return "#4b5a73";
  if (s >= 8)    return "#10b981";
  if (s >= 6)    return "#f59e0b";
  if (s >= 4)    return "#f97316";
  return                "#ef4444";
}

const COUNTRY_FLAGS: Record<string, string> = {
  "India":"🇮🇳","Bangladesh":"🇧🇩","Pakistan":"🇵🇰",
  "Japan":"🇯🇵","South Korea":"🇰🇷","China":"🇨🇳","Singapore":"🇸🇬",
  "France":"🇫🇷","Germany":"🇩🇪","Italy":"🇮🇹","Spain":"🇪🇸",
  "United Kingdom":"🇬🇧","Russia":"🇷🇺",
  "United States":"🇺🇸","Brazil":"🇧🇷","Mexico":"🇲🇽",
  "UAE":"🇦🇪","Saudi Arabia":"🇸🇦","Egypt":"🇪🇬","Australia":"🇦🇺",
};

// ── Tooltip ───────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={{
          position:     "absolute",
          bottom:       "calc(100% + 8px)",
          left:         "0",
          width:        "280px",
          background:   "#0f1420",
          border:       "1px solid #1e2438",
          borderRadius: "10px",
          padding:      "10px 13px",
          fontSize:     "13px",
          color:        "#a8b8d8",
          lineHeight:   1.55,
          zIndex:       999,
          boxShadow:    "0 8px 28px rgba(0,0,0,0.5)",
          pointerEvents:"none",
        }}>
          <div style={{ fontWeight: 700, color: "#f0f4ff", marginBottom: "4px", fontSize: "12px" }}>
            💬 AI Reasoning
          </div>
          {text}
          {/* Arrow */}
          <div style={{
            position:  "absolute",
            bottom:    "-6px",
            left:      "16px",
            width:     "10px",
            height:    "10px",
            background:"#0f1420",
            border:    "1px solid #1e2438",
            borderTop: "none",
            borderLeft:"none",
            transform: "rotate(45deg)",
          }} />
        </div>
      )}
    </div>
  );
}

// ── Country row inside accordion ──────────────────────────────────
function CountryRow({
  entry,
  onDelete,
  onRedirect,
}: {
  entry:      HistoryEntry;
  onDelete:   (id: string) => void;
  onRedirect: (region: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const color = scoreColor(entry.score);
  const flag  = COUNTRY_FLAGS[entry.target_region] ?? "🌐";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete analysis for ${entry.target_region}?`)) return;
    setDeleting(true);
    await deleteAnalysis(entry.id);
    onDelete(entry.id);
  };

  return (
    <Tooltip text={entry.reason}>
      <div
        onClick={() => onRedirect(entry.target_region)}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "12px",
          padding:        "10px 16px 10px 20px",
          cursor:         "pointer",
          borderTop:      "1px solid #141c2e",
          transition:     "background 0.12s",
          position:       "relative",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Flag + region */}
        <span style={{ fontSize: "18px", flexShrink: 0 }}>{flag}</span>
        <span style={{ fontSize: "14px", color: "#8896b3", minWidth: "130px" }}>
          {entry.target_region}
        </span>

        {/* Score bar */}
        <div style={{ flex: 1, height: "4px", background: "#141c2e", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            width:      `${((entry.score ?? 0) / 10) * 100}%`,
            height:     "100%",
            background: color,
            borderRadius: "2px",
          }} />
        </div>

        {/* Score number */}
        <span style={{
          fontSize:   "14px",
          fontWeight: 700,
          color:      color,
          minWidth:   "42px",
          textAlign:  "right",
          fontFamily: "Sora, sans-serif",
        }}>
          {entry.score !== null ? `${entry.score}/10` : "—"}
        </span>

        {/* Label */}
        <span style={{
          fontSize:   "12px",
          color:      "#4b5a73",
          minWidth:   "100px",
          flexShrink: 0,
        }}>
          {entry.label}
        </span>

        {/* Date */}
        <span style={{ fontSize: "12px", color: "#2e3a50", minWidth: "90px", textAlign: "right" }}>
          {new Date(entry.searched_at).toLocaleDateString("en-GB")}
        </span>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: "none", border: "none",
            color: "#2e3a50", cursor: deleting ? "not-allowed" : "pointer",
            fontSize: "14px", padding: "2px 4px", lineHeight: 1,
            opacity: deleting ? 0.4 : 1, flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#2e3a50")}
          title="Delete this entry"
        >
          🗑️
        </button>

        {/* Hover hint */}
        <span style={{
          position:   "absolute",
          right:      "48px",
          fontSize:   "10px",
          color:      "#2e3a50",
          pointerEvents: "none",
        }}>
          hover for reasoning
        </span>
      </div>
    </Tooltip>
  );
}

// ── Movie group row ───────────────────────────────────────────────
function MovieGroup({ group }: { group: GroupedHistory }) {
  const [open,    setOpen]    = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>(group.entries);
  const router                = useRouter();

  const bestEntry = entries.reduce<HistoryEntry | null>(
    (best, e) => (best === null || (e.score ?? 0) > (best.score ?? 0)) ? e : best,
    null
  );

  const handleMovieClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bestEntry) return;
    // Redirect to analyze page with best entry pre-loaded
    router.push(`/?movie=${encodeURIComponent(group.title)}&region=${encodeURIComponent(bestEntry.target_region)}`);
  };

  const handleCountryRedirect = (region: string) => {
    router.push(`/?movie=${encodeURIComponent(group.title)}&region=${encodeURIComponent(region)}`);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (entries.length === 0) return null;

  return (
    <div style={{
      background:   "#111827",
      border:       "1px solid #1e2438",
      borderRadius: "14px",
      overflow:     "hidden",
      marginBottom: "10px",
      transition:   "box-shadow 0.2s",
    }}>
      {/* ── Movie header row ── */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "14px",
          padding:     "14px 16px",
          cursor:      "pointer",
          transition:  "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Poster thumbnail */}
        {group.poster_url ? (
          <img
            src={group.poster_url}
            alt={group.title}
            style={{ width: "40px", height: "60px", objectFit: "cover",
                     borderRadius: "6px", flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: "40px", height: "60px", background: "#1e2438",
                        borderRadius: "6px", flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🎬
          </div>
        )}

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Clickable title → analyze page */}
            <span
              onClick={handleMovieClick}
              style={{
                fontFamily:   "Sora, sans-serif",
                fontWeight:   700,
                fontSize:     "16px",
                color:        "#f0f4ff",
                cursor:       "pointer",
                textDecoration: "none",
                transition:   "color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = "#818cf8";
                (e.target as HTMLElement).style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = "#f0f4ff";
                (e.target as HTMLElement).style.textDecoration = "none";
              }}
              title="Click to load this movie on the Analyze page"
            >
              {group.title}
            </span>

            {/* Country count badge */}
            <span style={{
              fontSize:     "11px",
              fontWeight:   600,
              color:        "#4b5a73",
              background:   "#0f1420",
              border:       "1px solid #1e2438",
              borderRadius: "99px",
              padding:      "2px 8px",
            }}>
              {entries.length} {entries.length === 1 ? "country" : "countries"}
            </span>

            {/* Best score badge */}
            {bestEntry && bestEntry.score !== null && (
              <span style={{
                fontSize:   "12px",
                fontWeight: 700,
                color:      scoreColor(bestEntry.score),
                background: `${scoreColor(bestEntry.score)}18`,
                border:     `1px solid ${scoreColor(bestEntry.score)}40`,
                borderRadius: "99px",
                padding:    "2px 8px",
              }}>
                Best: {bestEntry.score}/10 {bestEntry.target_region}
              </span>
            )}
          </div>

          {/* Release date */}
          <p style={{ fontSize: "12px", color: "#2e3a50", marginTop: "4px" }}>
            {group.release_date || "Unknown release"}
            {" · "}Last analyzed {new Date(group.latest_date).toLocaleDateString("en-GB")}
          </p>
        </div>

        {/* Expand chevron */}
        <div style={{
          fontSize:   "16px",
          color:      "#2e3a50",
          transition: "transform 0.2s",
          transform:  open ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>
          ▾
        </div>
      </div>

      {/* ── Accordion: country breakdown ── */}
      {open && (
        <div style={{ borderTop: "1px solid #141c2e" }}>
          {/* Column headers */}
          <div style={{
            display:   "flex",
            alignItems:"center",
            gap:       "12px",
            padding:   "7px 16px 7px 20px",
            background:"#0a0c14",
          }}>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em", minWidth:"18px" }}/>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em", minWidth:"130px" }}>
              Country
            </span>
            <span style={{ flex:1, fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em" }}>
              Score bar
            </span>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em", minWidth:"42px" }}>
              Score
            </span>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em", minWidth:"100px" }}>
              Label
            </span>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#2e3a50",
                           textTransform:"uppercase", letterSpacing:"0.08em", minWidth:"90px",
                           textAlign:"right" }}>
              Date
            </span>
            <span style={{ minWidth:"28px" }} />
          </div>

          {entries
            .slice()
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((entry) => (
              <CountryRow
                key={entry.id}
                entry={entry}
                onDelete={handleDeleteEntry}
                onRedirect={handleCountryRedirect}
              />
            ))}

          {/* Load on analyze page — full entry */}
          <div style={{ padding: "10px 16px", background: "#0a0c14", borderTop: "1px solid #141c2e" }}>
            <button
              onClick={handleMovieClick}
              style={{
                background:   "rgba(99,102,241,0.12)",
                border:       "1px solid rgba(99,102,241,0.25)",
                borderRadius: "8px",
                padding:      "6px 14px",
                fontSize:     "12px",
                fontWeight:   600,
                color:        "#818cf8",
                cursor:       "pointer",
              }}
            >
              🔍 Open best result on Analyze page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function HistoryTable({ data }: { data: GroupedHistory[] }) {
  if (!data.length) {
    return (
      <div style={{
        background: "#111827", border: "1px solid #1e2438", borderRadius: "18px",
        padding: "72px 24px", textAlign: "center", color: "#2e3a50", fontSize: "15px",
      }}>
        No analyses yet. Go to <strong style={{ color: "#818cf8" }}>Analyze</strong> to get started.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "12px", fontSize: "13px", color: "#2e3a50" }}>
        💡 Click a <strong style={{ color: "#4b5a73" }}>movie title</strong> to open it on the Analyze page.
        Click a <strong style={{ color: "#4b5a73" }}>country row</strong> to load that specific result.
        Hover any country for AI reasoning.
      </div>
      {data.map((group) => (
        <MovieGroup key={group.title} group={group} />
      ))}
    </div>
  );
}