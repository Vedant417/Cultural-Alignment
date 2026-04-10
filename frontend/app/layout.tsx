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
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: "#0d0f18" }}>

        {/* ── NAV ─────────────────────────────────────────────── */}
        <nav
          style={{
            position:        "sticky",
            top:             0,
            zIndex:          100,
            backgroundColor: "rgba(13,15,24,0.92)",
            borderBottom:    "1px solid #252d45",
            backdropFilter:  "blur(12px)",
          }}
        >
          <div
            style={{
              maxWidth:      "1200px",
              margin:        "0 auto",
              padding:       "0 24px",
              height:        "60px",
              display:       "flex",
              alignItems:    "center",
              justifyContent:"space-between",
            }}
          >
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width:           "34px",
                  height:          "34px",
                  borderRadius:    "10px",
                  background:      "linear-gradient(135deg, #6366f1, #4f46e5)",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  fontSize:        "18px",
                }}
              >
                🎬
              </div>
              <span
                className="font-sora"
                style={{ fontWeight: 800, fontSize: "17px", color: "#f0f4ff" }}
              >
                CultureAlign
              </span>
              <span
                style={{
                  fontSize:        "11px",
                  fontWeight:      700,
                  background:      "#1a1f3a",
                  color:           "#818cf8",
                  border:          "1px solid #312e81",
                  borderRadius:    "99px",
                  padding:         "2px 8px",
                }}
              >
                AI
              </span>
            </Link>

            {/* Nav links */}
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { href: "/",        label: "Analyze" },
                { href: "/history", label: "History" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="nav-link"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* ── MAIN ──────────────────────────────────────────────── */}
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}