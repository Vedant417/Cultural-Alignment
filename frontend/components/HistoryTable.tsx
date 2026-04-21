"use client";
import { GroupedHistory, HistoryEntry }          from "@/types";
import { deleteAnalysis, fetchDeepAnalysis, saveFavorite, removeFavorite }     from "@/lib/api";
import type { DeepAnalysisResponse }             from "@/lib/api";
import { useRouter }                             from "next/navigation";
import { useState }                              from "react";

function scoreColor(s: number | null) {
  if (s === null) return "var(--text-3)";
  if (s >= 8)    return "var(--green)";
  if (s >= 6)    return "var(--amber)";
  if (s >= 4)    return "var(--orange)";
  return                "var(--red)";
}
function scoreBg(s: number | null) {
  if (s === null) return "var(--bg-deep)";
  if (s >= 8)    return "var(--green-dim)";
  if (s >= 6)    return "var(--amber-dim)";
  if (s >= 4)    return "var(--orange-dim)";
  return                "var(--red-dim)";
}

const FLAGS: Record<string, string> = {
  "India":"🇮🇳","Bangladesh":"🇧🇩","Pakistan":"🇵🇰",
  "Japan":"🇯🇵","South Korea":"🇰🇷","China":"🇨🇳","Singapore":"🇸🇬",
  "France":"🇫🇷","Germany":"🇩🇪","Italy":"🇮🇹","Spain":"🇪🇸",
  "United Kingdom":"🇬🇧","Russia":"🇷🇺",
  "United States":"🇺🇸","Brazil":"🇧🇷","Mexico":"🇲🇽",
  "UAE":"🇦🇪","Saudi Arabia":"🇸🇦","Egypt":"🇪🇬","Australia":"🇦🇺",
};

function DeepPanel({
  entry,
  movieTitle,
  onClose,
}: {
  entry:      HistoryEntry;
  movieTitle: string;
  onClose:    () => void;
}) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [data,     setData]     = useState<DeepAnalysisResponse | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "language_dialogue": true, // Open first section by default
  });

  const handleDeepAnalysis = async () => {
    if (data) { setData(null); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDeepAnalysis(
        movieTitle,
        entry.target_region,
        entry.score ?? 5,
        entry.label,
        entry.reason
      );
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Deep analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SECTIONS = [
    { key: "language_dialogue",  label: "🗣️ Language & Dialogue" },
    { key: "religion_values",    label: "🕌 Religion & Values" },
    { key: "censorship_risk",    label: "⚠️ Censorship Risk" },
    { key: "audience_breakdown", label: "👥 Audience Breakdown" },
    { key: "historical_context", label: "📜 Historical Context" },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position:   "fixed",
          inset:      0,
          background: "rgba(0,0,0,0.5)",
          zIndex:     200,
          backdropFilter: "blur(4px)",
        }}
      />

      <div style={{
        position:  "fixed",
        top:       0,
        right:     0,
        height:    "100vh",
        width:     "min(520px, 95vw)",
        background:"var(--bg-card)",
        borderLeft:"1px solid var(--border)",
        zIndex:    201,
        overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        animation: "slideInRight 0.25s ease both",
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);   opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding:        "20px 22px 16px",
          borderBottom:   "1px solid var(--border)",
          position:       "sticky",
          top:            0,
          background:     "var(--bg-card)",
          zIndex:         1,
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          gap:            "12px",
        }}>
          <div>
            <h2 style={{
              fontFamily:    "Sora, sans-serif",
              fontWeight:    700,
              fontSize:      "16px",
              color:         "var(--text)",
              marginBottom:  "4px",
            }}>
              {FLAGS[entry.target_region] ?? "🌐"} {movieTitle}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
              {entry.target_region}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background:   "var(--bg-deep)",
              border:       "1px solid var(--border)",
              borderRadius: "8px",
              padding:      "6px 12px",
              color:        "var(--text-2)",
              cursor:       "pointer",
              fontSize:     "13px",
              flexShrink:   0,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 22px" }}>

          {/* Score Badge */}
          <div style={{
            background:   scoreBg(entry.score),
            border:       "1px solid var(--border)",
            borderRadius: "14px",
            padding:      "16px",
            marginBottom: "20px",
          }}>
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   "10px",
            }}>
              <span style={{
                fontFamily:  "Sora, sans-serif",
                fontWeight:  800,
                fontSize:    "28px",
                color:       scoreColor(entry.score),
              }}>
                {entry.score !== null ? `${entry.score}/10` : "—"}
              </span>
              <span style={{
                fontSize:     "12px",
                fontWeight:   700,
                color:        scoreColor(entry.score),
                background:   "var(--bg-card)",
                border:       "1px solid var(--border)",
                borderRadius: "99px",
                padding:      "3px 10px",
              }}>
                {entry.label}
              </span>
            </div>

            <div style={{
              height:       "5px",
              background:   "var(--score-track)",
              borderRadius: "3px",
              marginBottom: "12px",
              overflow:     "hidden",
            }}>
              <div style={{
                width:        `${((entry.score ?? 0) / 10) * 100}%`,
                height:       "100%",
                background:   scoreColor(entry.score),
                borderRadius: "3px",
              }} />
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>
              {entry.reason || "No summary available"}
            </p>
          </div>

          {/* Main Action Button - Generate/Toggle Deep Analysis */}
          <button
            onClick={handleDeepAnalysis}
            disabled={loading}
            style={{
              width:        "100%",
              background:   data
                ? "var(--bg-deep)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color:        data ? "var(--text-2)" : "#fff",
              border:       data ? "1px solid var(--border)" : "none",
              borderRadius: "12px",
              padding:      "12px",
              fontWeight:   700,
              fontSize:     "14px",
              cursor:       loading ? "not-allowed" : "pointer",
              marginBottom: "16px",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"center",
              gap:          "8px",
              boxShadow:    data ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
              transition:   "all 0.15s",
              opacity:      loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width:        "14px",
                  height:       "14px",
                  border:       "2px solid rgba(255,255,255,0.3)",
                  borderTopColor:"#fff",
                  borderRadius: "50%",
                  display:      "inline-block",
                  animation:    "spin 0.7s linear infinite",
                }} />
                Analyzing…
              </>
            ) : data
              ? "▲ Hide Analysis"
              : "🔍 Deep Analysis"}
          </button>

          {/* Error State */}
          {error && (
            <div style={{
              background:   "var(--red-dim)",
              border:       "1px solid rgba(239,68,68,0.25)",
              borderRadius: "10px",
              padding:      "12px 14px",
              marginBottom: "14px",
              fontSize:     "13px",
              color:        "var(--red)",
              display:      "flex",
              justifyContent: "space-between",
              alignItems:   "center",
            }}>
              <span>❌ {error}</span>
              <button
                onClick={handleDeepAnalysis}
                style={{
                  background:  "none",
                  border:      "1px solid var(--red)",
                  borderRadius:"6px",
                  padding:     "2px 8px",
                  color:       "var(--red)",
                  cursor:      "pointer",
                  fontSize:    "12px",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Deep Analysis Container - Unified Display */}
          {data && (
            <div style={{
              background:   "var(--bg-deep)",
              border:       "1px solid var(--border)",
              borderRadius: "14px",
              overflow:     "hidden",
              marginBottom: "16px",
            }}>
              {/* Cache indicator */}
              {data.cached && (
                <div style={{
                  background:   "rgba(34, 197, 94, 0.1)",
                  border:       "1px solid rgba(34, 197, 94, 0.3)",
                  borderBottom: "none",
                  padding:      "8px 14px",
                  fontSize:     "11px",
                  fontWeight:   600,
                  color:        "var(--green)",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "6px",
                }}>
                ⚡ Loaded from cache
              </div>
              )}

              {/* Sections */}
              {SECTIONS.map(({ key, label }) => {
                const text    = data.sections[key as keyof typeof data.sections];
                const isOpen  = openSections[key] ?? false;
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleSection(key)}
                      style={{
                        width:       "100%",
                        display:     "flex",
                        alignItems:  "center",
                        justifyContent: "space-between",
                        padding:     "14px 14px",
                        background:  isOpen ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        border:      "none",
                        cursor:      "pointer",
                        color:       "var(--text)",
                        fontSize:    "14px",
                        fontWeight:  600,
                        textAlign:   "left",
                        borderTop:   "1px solid var(--border-2)",
                        transition:  "background 0.15s",
                      }}
                      onMouseEnter={(e) => !isOpen && (e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)")}
                      onMouseLeave={(e) => !isOpen && (e.currentTarget.style.background = "transparent")}
                    >
                      {label}
                      <span style={{
                        fontSize:   "12px",
                        color:      "var(--text-3)",
                        transition: "transform 0.2s",
                        transform:  isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}>
                        ▾
                      </span>
                    </button>

                    {isOpen && text && (
                      <div style={{
                        padding:    "12px 14px",
                        fontSize:   "13px",
                        color:      "var(--text-2)",
                        lineHeight: 1.65,
                        background: "rgba(99, 102, 241, 0.04)",
                      }}>
                        {text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CountryRow({
  entry,
  movieTitle,
  onDelete,
}: {
  entry:      HistoryEntry;
  movieTitle: string;
  onDelete:   (id: string) => void;
}) {
  const [deleting,   setDeleting]   = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const flag  = FLAGS[entry.target_region] ?? "🌐";
  const color = scoreColor(entry.score);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete analysis for ${entry.target_region}?`)) return;
    setDeleting(true);
    await deleteAnalysis(entry.id);
    onDelete(entry.id);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriting(true);
    try {
      if (isFavorited) {
        await removeFavorite(entry.id);
        setIsFavorited(false);
      } else {
        await saveFavorite(entry.id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Failed to update favorite:", err);
    } finally {
      setFavoriting(false);
    }
  };

  return (
    <>
      {panelOpen && (
        <DeepPanel
          entry={entry}
          movieTitle={movieTitle}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <div
        onClick={() => setPanelOpen(true)}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "12px",
          padding:     "10px 16px",
          cursor:      "pointer",
          borderTop:   "1px solid var(--border-2)",
          transition:  "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        title={entry.reason || "Click for deep analysis"}
      >
        <span style={{ fontSize: "18px", flexShrink: 0 }}>{flag}</span>
        <span style={{ fontSize: "14px", color: "var(--text-2)", minWidth: "130px" }}>
          {entry.target_region}
        </span>

        <div style={{ flex:1, height:"4px", background:"var(--score-track)",
                      borderRadius:"2px", overflow:"hidden" }}>
          <div style={{
            width:      `${((entry.score ?? 0) / 10) * 100}%`,
            height:     "100%",
            background: color,
            borderRadius:"2px",
          }} />
        </div>

        <span style={{ fontSize:"14px", fontWeight:700, color,
                       minWidth:"42px", textAlign:"right",
                       fontFamily:"Sora, sans-serif" }}>
          {entry.score !== null ? `${entry.score}/10` : "—"}
        </span>

        <span style={{ fontSize:"12px", color:"var(--text-3)",
                       minWidth:"100px", flexShrink:0 }}>
          {entry.label}
        </span>

        <span style={{ fontSize:"12px", color:"var(--text-3)",
                       minWidth:"90px", textAlign:"right" }}>
          {new Date(entry.searched_at).toLocaleDateString("en-GB")}
        </span>

        <span style={{ fontSize:"11px", color:"var(--accent)",
                       flexShrink:0, whiteSpace:"nowrap" }}>
          🔍 Deep analysis
        </span>

        {/* Favorites button */}
        <button
          onClick={handleFavorite}
          disabled={favoriting}
          style={{ background:"none", border:"none", color: isFavorited ? "var(--amber)" : "var(--text-3)",
                   cursor: favoriting ? "not-allowed" : "pointer",
                   fontSize:"14px", padding:"2px 4px", opacity: favoriting ? 0.4 : 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--amber)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isFavorited ? "var(--amber)" : "var(--text-3)")}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorited ? "⭐" : "☆"}
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ background:"none", border:"none", color:"var(--text-3)",
                   cursor: deleting ? "not-allowed" : "pointer",
                   fontSize:"14px", padding:"2px 4px", opacity: deleting ? 0.4 : 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </>
  );
}

function MovieGroup({ group }: { group: GroupedHistory }) {
  const [open, setOpen]   = useState(false);
  const [entries, setEntries] = useState(group.entries);

  const best = entries.reduce<typeof entries[0] | null>(
    (b, e) => (!b || (e.score ?? 0) > (b.score ?? 0)) ? e : b, null
  );

  return (
    <div className="ca-card" style={{ marginBottom: "10px", overflow: "hidden" }}>
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
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {group.poster_url ? (
          <img src={group.poster_url} alt={group.title}
               style={{ width:"40px", height:"60px", objectFit:"cover",
                        borderRadius:"6px", flexShrink:0 }} />
        ) : (
          <div style={{ width:"40px", height:"60px", background:"var(--bg-deep)",
                        borderRadius:"6px", flexShrink:0, display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:"20px" }}>
            🎬
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"Sora,sans-serif", fontWeight:700,
                           fontSize:"16px", color:"var(--text)" }}>
              {group.title}
            </span>
            <span style={{ fontSize:"11px", color:"var(--text-3)",
                           background:"var(--bg-deep)", border:"1px solid var(--border)",
                           borderRadius:"99px", padding:"2px 8px" }}>
              {entries.length} {entries.length === 1 ? "country" : "countries"}
            </span>
            {best?.score !== null && best && (
              <span style={{ fontSize:"12px", fontWeight:700,
                             color: scoreColor(best.score),
                             background: scoreBg(best.score),
                             border:`1px solid ${scoreColor(best.score)}40`,
                             borderRadius:"99px", padding:"2px 8px" }}>
                Best: {best.score}/10 {best.target_region}
              </span>
            )}
          </div>
          <p style={{ fontSize:"12px", color:"var(--text-3)", marginTop:"4px" }}>
            {group.release_date || "Unknown release"} · Last {new Date(group.latest_date).toLocaleDateString("en-GB")}
          </p>
        </div>

        <span style={{ fontSize:"16px", color:"var(--text-3)",
                       transition:"transform 0.2s",
                       transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▾
        </span>
      </div>

      {open && (
        <div style={{ borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px",
                        padding:"7px 16px", background:"var(--bg-deep)" }}>
            <span style={{ minWidth:"18px" }} />
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", minWidth:"130px" }}>Country</span>
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", flex:1 }}>Score bar</span>
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", minWidth:"42px" }}>Score</span>
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", minWidth:"100px" }}>Label</span>
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", minWidth:"90px", textAlign:"right" }}>Date</span>
            <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-3)", minWidth:"90px" }}>Action</span>
            <span style={{ minWidth:"28px" }} />
          </div>

          {entries
            .slice()
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((entry) => (
              <CountryRow
                key={entry.id}
                entry={entry}
                movieTitle={group.title}
                onDelete={(id) => setEntries((p) => p.filter((e) => e.id !== id))}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryTable({ data }: { data: GroupedHistory[] }) {
  if (!data.length) {
    return (
      <div className="ca-card" style={{
        padding: "72px 24px", textAlign: "center",
        color: "var(--text-3)", fontSize: "15px",
      }}>
        No analyses yet.{" "}
        <a href="/" style={{ color:"var(--accent)", fontWeight:600 }}>
          Analyze a movie
        </a>{" "}
        to see it here.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize:"13px", color:"var(--text-3)", marginBottom:"14px" }}>
        💡 Click any <strong style={{ color:"var(--text-2)" }}>country row</strong> to open a
        deep analysis panel. Click the <strong style={{ color:"var(--text-2)" }}>movie row</strong> to expand all countries.
      </div>
      {data.map((group) => (
        <MovieGroup key={group.title.toLowerCase()} group={group} />
      ))}
    </div>
  );
}