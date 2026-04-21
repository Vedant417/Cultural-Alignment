"use client";
import { useEffect, useState } from "react";
import { AlignmentDocument } from "@/types";
import { getFavorites, removeFavorite } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function FavoritesPage() {
  const [items, setItems]     = useState<AlignmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const favorites = await getFavorites();
        setItems(favorites);
      } catch (err) {
        console.error("Failed to load favorites:", err);
        setError(err instanceof Error ? err.message : "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await removeFavorite(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const SCORE_COLOR: Record<number, string> = {
    10: "var(--green)", 9: "var(--green)", 8: "var(--green)",
    7: "var(--amber)", 6: "var(--amber)",
    5: "var(--orange)", 4: "var(--orange)",
    3: "var(--red)", 2: "var(--red)", 1: "var(--red)",
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return "var(--text-3)";
    if (score >= 8) return "var(--green)";
    if (score >= 6) return "var(--amber)";
    if (score >= 4) return "var(--orange)";
    return "var(--red)";
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            ⭐ Saved Analyses
          </h1>
          <p style={{ color: "var(--text-2)" }}>
            Your favorite cultural fit analyses saved for quick reference.
          </p>
        </div>
        <LanguageSwitcher compact />
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: "center",
          color: "var(--text-3)",
          padding: "60px 24px",
        }}>
          <div style={{
            display: "inline-block",
            width: "36px", height: "36px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.75s linear infinite",
          }} />
          <p style={{ marginTop: "16px" }}>Loading your favorites…</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          background: "var(--red-dim)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "14px",
          padding: "18px 22px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "20px", flexShrink: 0 }}>❌</span>
          <div>
            <p style={{ color: "var(--red)", fontWeight: 700, marginBottom: "4px", fontSize: "15px" }}>
              Failed to load favorites
            </p>
            <p style={{ color: "var(--text-2)", fontSize: "14px" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div style={{
          textAlign: "center",
          color: "var(--text-3)",
          padding: "60px 24px",
          border: "1px dashed var(--border)",
          borderRadius: "16px",
        }}>
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>⭐</p>
          <p style={{ fontWeight: 600, marginBottom: "4px" }}>No saved analyses yet</p>
          <p style={{ fontSize: "14px" }}>
            Star an analysis from the <a href="/history" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>History page</a> to save it here.
          </p>
        </div>
      )}

      {/* Favorites List */}
      {!loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="ca-card"
              style={{
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: "16px",
                  marginBottom: "4px",
                }}>
                  {item.movie?.title ?? "Unknown"}
                </p>
                <p style={{
                  fontSize: "14px",
                  color: "var(--text-2)",
                  marginBottom: "8px",
                }}>
                  {item.origin_region?.region ?? "Unknown"} → {item.target_region}
                </p>
                <div style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}>
                  {/* Score Badge */}
                  <div style={{
                    background: item.result?.score ? `${getScoreColor(item.result.score)}1a` : "var(--bg-deep)",
                    border: `1px solid ${getScoreColor(item.result?.score ?? null)}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <span style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: getScoreColor(item.result?.score ?? null),
                    }}>
                      {item.result?.score !== null && item.result?.score !== undefined
                        ? `${item.result.score}/10`
                        : "—"}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: getScoreColor(item.result?.score ?? null),
                    }}>
                      {item.result?.label ?? ""}
                    </span>
                  </div>

                  {/* Analysis Summary */}
                  {item.result?.reason && (
                    <p style={{
                      fontSize: "13px",
                      color: "var(--text-3)",
                      flex: 1,
                      minWidth: "200px",
                    }}>
                      💬 {item.result.reason.substring(0, 80)}…
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "8px",
                flexShrink: 0,
              }}>
                <button
                  onClick={() => handleRemove(item.id)}
                  style={{
                    background: "var(--amber-dim)",
                    border: "1px solid var(--amber)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--amber)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--amber)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--amber-dim)";
                    e.currentTarget.style.color = "var(--amber)";
                  }}
                >
                  ★ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}