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

  const getScoreColor = (score: number | null) => {
    if (!score) return "var(--text-3)";
    if (score >= 7.5) return "#10b981"; // green - Excellent
    if (score >= 5) return "#f59e0b"; // amber - Good
    return "#ef4444"; // red - Poor
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 7.5) return "Excellent";
    if (score >= 5) return "Good";
    if (score >= 2.5) return "Fair";
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

      {/* Target Region Header */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          background: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-2)",
            marginBottom: "6px",
          }}
        >
          {t("cultural_fit_for")} <strong>{targetRegion}</strong>
        </p>
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
            border: `2px solid ${movieA.winner ? "#10b981" : "var(--border)"}`,
            overflow: "hidden",
            background: "var(--bg-card)",
            transition: "all 0.3s",
            boxShadow: movieA.winner
              ? "0 0 20px rgba(16, 185, 129, 0.3)"
              : "none",
          }}
        >
          {/* Winner Badge */}
          {movieA.winner && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(16, 185, 129, 0.1)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}

          {movieA.winner && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "#10b981",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              🏆 Winner
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
                background: getScoreColor(movieA.score),
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>
                {movieA.score?.toFixed(1) || "N/A"}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600 }}>
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

            {/* Reason */}
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-2)",
                marginBottom: "10px",
                lineHeight: 1.4,
              }}
            >
              {movieA.reason}
            </p>

            {/* Content Flags - More Compact */}
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "11px",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  color: "var(--accent)",
                  marginBottom: "6px",
                }}
              >
                Content Flags:
              </p>
              <ul style={{ margin: 0, paddingLeft: "14px", color: "var(--text-3)" }}>
                <li>Violence: {movieA.content_flags.violence}</li>
                <li>Adult: {movieA.content_flags.adult_content}</li>
                <li>Religion: {movieA.content_flags.religion_sensitivity}</li>
                <li>Drugs: {movieA.content_flags.drug_glorification}</li>
              </ul>
            </div>

            {/* Audience Note */}
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-3)",
                fontStyle: "italic",
              }}
            >
              "{movieA.audience_note}"
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
          {/* Winner Overlay */}
          {movieB.winner && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(16, 185, 129, 0.1)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}

          {movieB.winner && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "#10b981",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              🏆 Winner
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
                background: getScoreColor(movieB.score),
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>
                {movieB.score?.toFixed(1) || "N/A"}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600 }}>
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

            {/* Reason */}
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-2)",
                marginBottom: "10px",
                lineHeight: 1.4,
              }}
            >
              {movieB.reason}
            </p>

            {/* Content Flags - More Compact */}
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "11px",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  color: "var(--accent)",
                  marginBottom: "6px",
                }}
              >
                Content Flags:
              </p>
              <ul style={{ margin: 0, paddingLeft: "14px", color: "var(--text-3)" }}>
                <li>Violence: {movieB.content_flags.violence}</li>
                <li>Adult: {movieB.content_flags.adult_content}</li>
                <li>Religion: {movieB.content_flags.religion_sensitivity}</li>
                <li>Drugs: {movieB.content_flags.drug_glorification}</li>
              </ul>
            </div>

            {/* Audience Note */}
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-3)",
                fontStyle: "italic",
              }}
            >
              "{movieB.audience_note}"
            </p>
          </div>
        </div>
      </div>

      {/* Final Verdict */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-2)", fontSize: "14px", marginBottom: "8px" }}>
          Final Verdict for {targetRegion}
        </p>
        <h2
          style={{
            color: "#10b981",
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "8px",
          }}
        >
          🏆 {movieA.winner ? movieA.movie.title : movieB.movie.title} Wins!
        </h2>
        <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
          {movieA.winner
            ? `${movieA.movie.title} is more culturally aligned for ${targetRegion} audiences`
            : `${movieB.movie.title} is more culturally aligned for ${targetRegion} audiences`}
        </p>
      </div>
    </div>
  );
}
