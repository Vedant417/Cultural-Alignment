"use client";
import { useEffect, useState } from "react";

export default function FavoritesPage() {
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, []);

  const unstar = async (id: string) => {
    await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  };

  return (
    <div>
      <h1 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800,
        fontSize: "clamp(24px,4vw,36px)", color: "var(--text)", marginBottom: "28px" }}>
        ⭐ Saved Analyses
      </h1>

      {loading && <p style={{ color: "var(--text-3)" }}>Loading…</p>}
      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-3)", padding: "60px 24px",
          border: "1px dashed var(--border)", borderRadius: "16px" }}>
          No saved analyses yet. Star an analysis from the History page.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((item) => (
          <div key={item.id} className="ca-card" style={{ padding: "16px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <p style={{ fontWeight: 700, color: "var(--text)", fontSize: "15px", marginBottom: "2px" }}>
                {item.movie?.title ?? "Unknown"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
                {item.target_region} · {item.result?.score}/10 · {item.result?.label}
              </p>
            </div>
            <button onClick={() => unstar(item.id)} style={{
              background: "var(--amber-dim)", border: "1px solid var(--amber)",
              borderRadius: "8px", padding: "6px 12px", fontSize: "12px",
              fontWeight: 700, color: "var(--amber)", cursor: "pointer",
            }}>
              ★ Unsave
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}