"use client";
import { AlignmentDocument } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import MovieDetailsCard from "@/components/MovieDetailsCard";
import ScoreBadge from "@/components/ScoreBadge";
import ContentFlags from "@/components/ContentFlags";
import SimilarMovies from "@/components/SimilarMovies";

interface Props {
  data: AlignmentDocument | null;
  onClose: () => void;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Sora, sans-serif",
      fontWeight: 700,
      fontSize: "17px",
      color: "var(--text)",
      marginBottom: "14px",
      letterSpacing: "-0.01em",
    }}>
      {children}
    </h2>
  );
}

export default function FavoritesDetailModal({ data, onClose }: Props) {
  const { t } = useLanguage();

  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          maxWidth: "900px",
          width: "90vw",
          maxHeight: "85vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header with close button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-deep)",
          }}
        >
          <div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: "4px",
            }}>
              {data.movie.title}
            </h1>
            <p style={{
              fontSize: "13px",
              color: "var(--text-2)",
            }}>
              {data.origin_region?.region} → {data.target_region}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              lineHeight: 1,
              color: "var(--text-2)",
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-2)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {/* Overview Section */}
          {data.movie.overview && (
            <div className="ca-card" style={{ marginBottom: "20px" }}>
              <SectionHeading>📖 Overview</SectionHeading>
              <p style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-2)",
              }}>
                {data.movie.overview}
              </p>
            </div>
          )}

          {/* Two-column layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}>
            {/* Left: Movie Details */}
            <div>
              <SectionHeading>🎬 Movie Details</SectionHeading>
              <div className="ca-card">
                <MovieDetailsCard
                  movie={data.movie}
                  originRegion={data.origin_region?.region ?? "Unknown"}
                />
              </div>
            </div>

            {/* Right: Cultural Fit Analysis */}
            <div>
              <SectionHeading>🌍 Cultural Fit — {data.target_region}</SectionHeading>
              <div className="ca-card">
                <ScoreBadge
                  result={data.result}
                  targetRegion={data.target_region}
                  cached={data.cached}
                />
              </div>
            </div>
          </div>

          {/* Content Flags */}
          {data.result.content_flags && (
            <div className="ca-card" style={{ marginBottom: "16px" }}>
              <SectionHeading>⚠️ Content Tags</SectionHeading>
              <ContentFlags flags={data.result.content_flags} />
            </div>
          )}

          {/* Analysis Reason */}
          {data.result.reason && (
            <div className="ca-card" style={{ marginBottom: "16px" }}>
              <SectionHeading>💡 Why This Score?</SectionHeading>
              <p style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-2)",
              }}>
                {data.result.reason}
              </p>
            </div>
          )}

          {/* Audience Note */}
          {data.result.audience_note && (
            <div className="ca-card" style={{ marginBottom: "16px" }}>
              <SectionHeading>👥 Audience Note</SectionHeading>
              <p style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-2)",
              }}>
                {data.result.audience_note}
              </p>
            </div>
          )}

          {/* Similar Movies / Recommendations */}
          {data.result.similar_movies && data.result.similar_movies.length > 0 && (
            <div className="ca-card">
              <SectionHeading>🍿 You Might Also Like</SectionHeading>
              <SimilarMovies movies={data.result.similar_movies} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
