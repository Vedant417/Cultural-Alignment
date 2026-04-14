import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title:       "CultureAlign — AI Cultural Analysis",
  description: "Analyze how well a movie fits any country's culture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#0a0c14", margin: 0, minHeight: "100vh" }}>

        {/* ── NAV ───────────────────────────────────────────────── */}
        <nav style={{
          position:        "sticky",
          top:             0,
          zIndex:          100,
          backgroundColor: "rgba(10,12,20,0.95)",
          borderBottom:    "1px solid #1e2438",
          backdropFilter:  "blur(16px)",
        }}>
          <div style={{
            maxWidth:       "1200px",
            margin:         "0 auto",
            padding:        "0 28px",
            height:         "62px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width:          "36px",
                height:         "36px",
                borderRadius:   "10px",
                background:     "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "18px",
                boxShadow:      "0 4px 14px rgba(99,102,241,0.35)",
              }}>
                🎬
              </div>
              <span style={{
                fontFamily:  "Sora, sans-serif",
                fontWeight:  800,
                fontSize:    "18px",
                color:       "#f0f4ff",
                letterSpacing: "-0.01em",
              }}>
                CultureAlign
              </span>
              <span style={{
                fontSize:     "11px",
                fontWeight:   700,
                background:   "rgba(99,102,241,0.15)",
                color:        "#818cf8",
                border:       "1px solid rgba(99,102,241,0.3)",
                borderRadius: "99px",
                padding:      "2px 9px",
                letterSpacing: "0.04em",
              }}>
                AI
              </span>
            </Link>

            {/* Nav links — Analyze | Compare | History */}
            <div style={{ display: "flex", gap: "2px" }}>
              {[
                { href: "/",        label: "Analyze",  icon: "🔍" },
                { href: "/compare", label: "Compare",  icon: "📊" },
                { href: "/history", label: "History",  icon: "📜" },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    gap:            "6px",
                    padding:        "7px 14px",
                    borderRadius:   "8px",
                    fontSize:       "14px",
                    fontWeight:     500,
                    color:          "#8896b3",
                    textDecoration: "none",
                    transition:     "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#f0f4ff";
                    el.style.backgroundColor = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#8896b3";
                    el.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: "13px" }}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* ── MAIN ─────────────────────────────────────────────── */}
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "44px 28px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}