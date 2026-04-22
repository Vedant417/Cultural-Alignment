import React from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface MovieCompareData {
  movie: {
    title: string;
    overview: string;
    release_date: string;
    language: string;
    poster_url?: string;
    genres?: Array<{ id: number; name: string }>;
    popularity?: number;
  };
  origin_region: {
    region: string;
    state: string;
    lat: number;
    lon: number;
  };
  score: number | null;
  label: string;
  reason: string;
  audience_note: string;
  content_flags: {
    violence: string;
    adult_content: string;
    religion_sensitivity: string;
    drug_glorification: string;
  };
  winner: boolean;
}

interface MovieVsMovieComparisonProps {
  movieA: MovieCompareData;
  movieB: MovieCompareData;
  targetRegion: string;
  cached?: boolean;
}

export default function MovieVsMovieComparison({
  movieA,
  movieB,
  targetRegion,
  cached = false,
}: MovieVsMovieComparisonProps) {
  const { t } = useLanguage();

  // Detect if scores are tied (within 0.5 point tolerance)
  const scoresDifference = Math.abs((movieA.score || 0) - (movieB.score || 0));
  const isTied = scoresDifference <= 0.5;

  const getScoreColor = (score: number | null, isWinner: boolean = false) => {
    if (!score) return "var(--text-3)";
    if (isTied) return "#3b82f6"; // blue - Tied
    if (isWinner) return "#10b981"; // green - Winner
    return "#6366f1"; // indigo - Runner-up
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 8) return "Excellent";
    if (score >= 6.5) return "Strong";
    if (score >= 5) return "Good";
    if (score >= 3) return "Moderate";
    return "Poor";
  };

  return (
    <div style={{ marginTop: "24px" }}>
      {/* Cache notice */}
      {cached && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-glow)",
            borderRadius: "10px",
            padding: "5px 13px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          ⚡ Loaded from cache
        </div>
      )}

      {/* Target Region Header with Tie Status */}
      <div
        style={{
          marginBottom: "24px",
          padding: "18px 20px",
          background: "var(--bg-card)",
          borderRadius: "12px",
          border: isTied ? "2px solid #3b82f6" : "1px solid var(--border)",
          textAlign: "center",
          boxShadow: isTied ? "0 0 20px rgba(59, 130, 246, 0.15)" : "none",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          {t("cultural_fit_for")} <strong>{targetRegion}</strong>
        </p>
        {isTied && (
          <p style={{ fontSize: "13px", color: "#3b82f6", fontWeight: 600, margin: 0 }}>
            🤝 Both movies are equally culturally aligned
          </p>
        )}
      </div>

      {/* Side-by-side comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Movie A Card */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            border: `2px solid ${
              isTied ? "#3b82f6" : movieA.winner ? "#10b981" : "#6366f1"
            }`,
            overflow: "hidden",
            background: "var(--bg-card)",
            transition: "all 0.3s",
            boxShadow: isTied
              ? "0 0 20px rgba(59, 130, 246, 0.2)"
              : movieA.winner
              ? "0 0 20px rgba(16, 185, 129, 0.3)"
              : "0 0 15px rgba(99, 102, 241, 0.15)",
          }}
        >
          {/* Overlay for visual distinction */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isTied
                ? "rgba(59, 130, 246, 0.05)"
                : movieA.winner
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(99, 102, 241, 0.04)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Status Badge */}
          {(isTied || movieA.winner) && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: isTied ? "#3b82f6" : movieA.winner ? "#10b981" : "transparent",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {isTied ? "🤝 Tied" : "🏆 Better Fit"}
            </div>
          )}

          <div style={{ padding: "20px", position: "relative", zIndex: 2 }}>
            {/* Poster */}
            {movieA.movie.poster_url && (
              <img
                src={movieA.movie.poster_url}
                alt={movieA.movie.title}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  aspectRatio: "2/3",
                  objectFit: "cover",
                  maxHeight: "180px",
                }}
              />
            )}

            {/* Movie Title */}
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "2px",
                wordBreak: "break-word",
              }}
            >
              {movieA.movie.title}
            </h3>

            {/* Release Date */}
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-3)",
                marginBottom: "12px",
              }}
            >
              {movieA.movie.release_date}
            </p>

            {/* Score Badge */}
            <div
              style={{
                background: getScoreColor(movieA.score, movieA.winner),
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "12px",
                boxShadow: `0 4px 12px ${getScoreColor(movieA.score, movieA.winner)}40`,
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1 }}>
                {movieA.score?.toFixed(1) || "N/A"}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>
                {getScoreLabel(movieA.score)}
              </div>
            </div>

            {/* Label */}
            <div
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "12px",
                fontSize: "12px",
                color: "var(--accent)",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {movieA.label}
            </div>

            {/* Reason - Enhanced Typography */}
            <div
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  margin: 0,
                  letterSpacing: "0.3px",
                }}
              >
                {movieA.reason}
              </p>
            </div>

            {/* Content Flags - Enhanced Display */}
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: "10px",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ⚠️ Content Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Violence</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieA.content_flags.violence}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Adult</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieA.content_flags.adult_content}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Religion</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieA.content_flags.religion_sensitivity}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Drugs</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieA.content_flags.drug_glorification}
                  </span>
                </div>
              </div>
            </div>

            {/* Audience Note - Enhanced */}
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                fontStyle: "italic",
                padding: "12px",
                background: "var(--bg-deep)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "4px",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              💭 {movieA.audience_note}
            </p>
          </div>
        </div>

        {/* Movie B Card */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            border: `2px solid ${movieB.winner ? "#10b981" : "var(--border)"}`,
            overflow: "hidden",
            background: "var(--bg-card)",
            transition: "all 0.3s",
            boxShadow: movieB.winner
              ? "0 0 20px rgba(16, 185, 129, 0.3)"
              : "none",
          }}
        >
          {/* Overlay for visual distinction */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isTied
                ? "rgba(59, 130, 246, 0.05)"
                : movieB.winner
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(99, 102, 241, 0.04)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Status Badge */}
          {(isTied || movieB.winner) && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: isTied ? "#3b82f6" : movieB.winner ? "#10b981" : "transparent",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {isTied ? "🤝 Tied" : "🏆 Better Fit"}
            </div>
          )}

          <div style={{ padding: "20px", position: "relative", zIndex: 2 }}>
            {/* Poster */}
            {movieB.movie.poster_url && (
              <img
                src={movieB.movie.poster_url}
                alt={movieB.movie.title}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  aspectRatio: "2/3",
                  objectFit: "cover",
                  maxHeight: "180px",
                }}
              />
            )}

            {/* Movie Title */}
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "2px",
                wordBreak: "break-word",
              }}
            >
              {movieB.movie.title}
            </h3>

            {/* Release Date */}
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-3)",
                marginBottom: "12px",
              }}
            >
              {movieB.movie.release_date}
            </p>

            {/* Score Badge */}
            <div
              style={{
                background: getScoreColor(movieB.score, movieB.winner),
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "12px",
                boxShadow: `0 4px 12px ${getScoreColor(movieB.score, movieB.winner)}40`,
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1 }}>
                {movieB.score?.toFixed(1) || "N/A"}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>
                {getScoreLabel(movieB.score)}
              </div>
            </div>

            {/* Label */}
            <div
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "12px",
                fontSize: "12px",
                color: "var(--accent)",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {movieB.label}
            </div>

            {/* Reason - Enhanced Typography */}
            <div
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  margin: 0,
                  letterSpacing: "0.3px",
                }}
              >
                {movieB.reason}
              </p>
            </div>

            {/* Content Flags - Enhanced Display */}
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: "10px",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ⚠️ Content Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Violence</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieB.content_flags.violence}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Adult</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieB.content_flags.adult_content}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Religion</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieB.content_flags.religion_sensitivity}
                  </span>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-2)", display: "block", fontSize: "12px", marginBottom: "2px" }}>Drugs</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                    {movieB.content_flags.drug_glorification}
                  </span>
                </div>
              </div>
            </div>

            {/* Audience Note - Enhanced */}
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                fontStyle: "italic",
                padding: "12px",
                background: "var(--bg-deep)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "4px",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              💭 {movieB.audience_note}
            </p>
          </div>
        </div>
      </div>

      {/* Final Verdict */}
      <div
        style={{
          background: isTied
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: isTied
            ? "1px solid rgba(59, 130, 246, 0.3)"
            : "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-2)", fontSize: "14px", marginBottom: "12px" }}>
          Final Verdict for <strong>{targetRegion}</strong>
        </p>
        {isTied ? (
          <>
            <h2
              style={{
                color: "#3b82f6",
                fontSize: "28px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              🤝 Perfect Tie!
            </h2>
            <p style={{ color: "var(--text)", fontSize: "15px", lineHeight: 1.6 }}>
              Both <strong>{movieA.movie.title}</strong> and <strong>{movieB.movie.title}</strong> are equally well-suited for {targetRegion} audiences.
              <br/>
              Choose based on your mood — either will provide excellent cultural alignment!
            </p>
          </>
        ) : (
          <>
            <h2
              style={{
                color: "#10b981",
                fontSize: "28px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              🏆 {movieA.winner ? movieA.movie.title : movieB.movie.title}
            </h2>
            <p style={{ color: "var(--text)", fontSize: "15px", lineHeight: 1.6 }}>
              <strong>{movieA.winner ? movieA.movie.title : movieB.movie.title}</strong> is more culturally aligned for {targetRegion} audiences.
              <br/>
              <span style={{ fontSize: "14px", color: "var(--text-2)" }}>
                (Score: {(movieA.winner ? movieA.score : movieB.score)?.toFixed(1)} vs {(movieA.winner ? movieB.score : movieA.score)?.toFixed(1)})
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
