import { useState } from "react";

interface Recommendation {
  title: string;
  poster_url: string;
  release_date: string;
  tmdb_id?: number;
}

export default function RecommendationsSlider({ recommendations }: { recommendations?: Recommendation[] }) {
  if (!recommendations?.length) return null;

  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
        ⭐ Recommendations For You
      </p>

      {/* Horizontal Slider Container */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: "12px",
        paddingBottom: "8px",
        scrollBehavior: "smooth",
        scrollSnapType: "x mandatory",
      }}>
        {recommendations.map((rec, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: "140px",
              scrollSnapAlign: "start",
            }}
          >
            {/* Poster Image */}
            {rec.poster_url ? (
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "2/3",
                borderRadius: "10px",
                overflow: "hidden",
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                marginBottom: "8px",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}>
                <img
                  src={rec.poster_url}
                  alt={rec.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: "100%",
                aspectRatio: "2/3",
                borderRadius: "10px",
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "8px",
                color: "var(--text-2)",
                fontSize: "12px",
              }}>
                No Poster
              </div>
            )}

            {/* Movie Info */}
            <p style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {rec.title}
            </p>

            {rec.release_date && (
              <p style={{
                fontSize: "10px",
                color: "var(--text-3)",
              }}>
                {new Date(rec.release_date).getFullYear()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
