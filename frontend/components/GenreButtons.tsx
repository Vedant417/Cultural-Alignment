import { useState } from "react";
import { getMoviesByGenre } from "@/lib/api";

interface Genre {
  id: number;
  name: string;
}

interface GenreMovie {
  title: string;
  poster_url: string;
  release_date: string;
  tmdb_id?: number;
}

export default function GenreButtons({ genres }: { genres?: Genre[] }) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [movies, setMovies] = useState<GenreMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!genres?.length) return null;

  const handleGenreClick = async (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre(null);
      setMovies([]);
      setError(null);
      return;
    }

    setSelectedGenre(genreName);
    setLoading(true);
    setError(null);

    try {
      const result = await getMoviesByGenre(genreName, 20);
      if (result.movies && result.movies.length > 0) {
        setMovies(result.movies);
      } else {
        setMovies([]);
        setError(`No movies found for genre: ${genreName}`);
      }
    } catch (err) {
      setError(`Failed to fetch movies for ${genreName}`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
        🎬 Filter by Genre
      </p>

      {/* Genre Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: selectedGenre ? "20px" : "0" }}>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGenreClick(g.name)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: selectedGenre === g.name ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: selectedGenre === g.name ? "var(--accent)" : "transparent",
              color: selectedGenre === g.name ? "var(--bg)" : "var(--text-2)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Movies Slider */}
      {selectedGenre && (
        <div>
          {loading && (
            <p style={{ color: "var(--text-2)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              Loading movies...
            </p>
          )}

          {error && (
            <div style={{
              background: "var(--red-dim)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "10px",
              padding: "12px",
              color: "var(--red)",
              fontSize: "13px",
              marginBottom: "12px",
            }}>
              ⚠️ {error}
            </div>
          )}

          {movies.length > 0 && (
            <div style={{
              display: "flex",
              overflowX: "auto",
              gap: "12px",
              paddingBottom: "8px",
              scrollBehavior: "smooth",
              scrollSnapType: "x mandatory",
            }}>
              {movies.map((movie, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: "140px",
                    scrollSnapAlign: "start",
                  }}
                >
                  {/* Poster Image */}
                  {movie.poster_url ? (
                    <div style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "2/3",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "var(--bg-1)",
                      border: "1px solid var(--border)",
                      marginBottom: "8px",
                    }}>
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
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
                    {movie.title}
                  </p>

                  {movie.release_date && (
                    <p style={{
                      fontSize: "10px",
                      color: "var(--text-3)",
                    }}>
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
