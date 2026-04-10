import { SimilarMovie } from "@/types";

export default function SimilarMovies({ movies }: { movies: SimilarMovie[] }) {
  if (!movies?.length) return null;
  return (
    <div style={{ background: "#141824", border: "1px solid #252d45",
                  borderRadius: "16px", padding: "20px" }}>
      <p style={{ fontSize: "10px", fontWeight: 700, color: "#8896b3",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
        🍿 You Might Also Like
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
        {movies.slice(0, 3).map((m, i) => (
          <div key={i} style={{
            background: "#0d0f18", border: "1px solid #252d45",
            borderRadius: "10px", padding: "12px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0",
                        marginBottom: "6px", lineHeight: 1.3 }}>
              🎬 {m.title}
            </p>
            <p style={{ fontSize: "12px", color: "#8896b3", lineHeight: 1.5 }}>
              {m.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}