import { MovieInfo } from "@/types";

import { Star, Check } from "lucide-react";
import { saveFavorite } from "@/lib/api";

import { useState } from "react";

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",    hi: "Hindi",      ta: "Tamil",
  te: "Telugu",     ml: "Malayalam",  kn: "Kannada",
  mr: "Marathi",    bn: "Bengali",    fr: "French",
  es: "Spanish",    de: "German",     ja: "Japanese",
  ko: "Korean",     zh: "Chinese",    it: "Italian",
  pt: "Portuguese", ru: "Russian",    ar: "Arabic",
  tr: "Turkish",
};

export default function MovieDetailsCard({
  movie,
  originRegion,
  analysisId,
}: {
  movie: MovieInfo;
  originRegion: string;
  analysisId: string;
}) {
    const lang =
    LANGUAGE_MAP[movie.language] ??
    movie.language.toUpperCase();

  const [saved, setSaved] = useState(false);

  return (

    <div style={{
      background:
        "linear-gradient(180deg, rgba(17,24,39,0.95), rgba(10,15,28,0.98))",

      border: "1px solid rgba(255,255,255,0.06)",

      backdropFilter: "blur(18px)",

      boxShadow:
        "0 20px 60px rgba(0,0,0,0.45)",
      borderRadius: "16px",
      overflow:     "hidden",
    }}>
      {/* Poster */}
      {movie.poster_url && (
        <div style={{ position: "relative", width: "100%", height: "220px" }}>
          <img
            src={movie.poster_url}
            alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position:   "absolute", inset: 0,
            background: "linear-gradient(to top, #141824 0%, transparent 60%)",
          }} />
        </div>
      )}

      <div style={{ padding: "20px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
          📽️ Movie Info
        </p>
        <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "20px",
                     color: "#f0f4ff", marginBottom: "16px", lineHeight: 1.25 }}>
          {movie.title}
        </h2>
        <hr style={{ border: "none", borderTop: "1px solid #252d45", marginBottom: "16px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Row icon="📅" label="Released" value={movie.release_date || "N/A"} />
          <Row icon="🌐" label="Language"  value={lang} />
          <Row icon="🎥" label="Origin"    value={originRegion} />
          <Row icon="📖" label="Overview"  value={movie.overview || "No overview available."} />
          
          {/* External Links */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #252d45" }}>
            {movie.imdb_id && (
              <a
                href={`https://www.imdb.com/title/${movie.imdb_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: "#ffd700",
                  color: "#000",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "12px",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                🎬 IMDb
              </a>
            )}
            {movie.tmdb_id && (
              <a
                href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: "#01b4e4",
                  color: "#fff",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "12px",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                🎞️ TMDB
              </a>
            )}

            <button
              onClick={async () => {
                try {
                  await saveFavorite(analysisId);
                  setSaved(true);
                } catch (err) {
                  console.error(err);
                }
              }}
              disabled={saved}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: saved
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(255,215,0,0.12)",
                color: saved ? "#10b981" : "#ffd700",
                border: saved
                  ? "1px solid rgba(16,185,129,0.3)"
                  : "1px solid rgba(255,215,0,0.25)",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: saved ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {saved ? <Check size={14} /> : <Star size={14} />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px" }}>
      <span style={{ marginTop: "1px" }}>{icon}</span>
      <span style={{ color: "#8896b3", fontWeight: 600, minWidth: "70px", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: "#c8d3ea", lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}