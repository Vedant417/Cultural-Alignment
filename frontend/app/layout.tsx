import type { Metadata } from "next";
import "./globals.css";
import Link                from "next/link";
import { ThemeProvider }   from "@/components/ThemeProvider";
import ThemeToggle         from "@/components/ThemeToggle";
import { LanguageProvider } from "@/hooks/useLanguage";

export const metadata: Metadata = {
  title:       "CultureAlign — AI Cultural Analysis",
  description: "Analyze how well a movie fits any country's culture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* Prevent flash: set theme before render */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('ca-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })();
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider>

            <nav style={{
              position:        "sticky",
              top:             0,
              zIndex:          100,
              backgroundColor: "var(--nav-bg)",
              borderBottom:    "1px solid var(--border)",
              backdropFilter:  "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow:       "var(--shadow-nav)",
              transition:      "background-color 0.25s, border-color 0.25s",
            }}>
              <div style={{
                maxWidth:       "1240px",
                margin:         "0 auto",
                padding:        "0 28px",
                height:         "64px",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                gap:            "16px",
              }}>

                <Link href="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:"11px", flexShrink:0 }}>
                  <div style={{
                    width:          "38px",
                    height:         "38px",
                    borderRadius:   "11px",
                    background:     "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       "20px",
                    boxShadow:      "0 4px 14px rgba(99,102,241,0.4)",
                    flexShrink:     0,
                  }}>
                    🎬
                  </div>
                  <span style={{
                    fontFamily:    "Sora, sans-serif",
                    fontWeight:    800,
                    fontSize:      "18px",
                    color:         "var(--text)",
                    letterSpacing: "-0.01em",
                    transition:    "color 0.25s",
                  }}>
                    CultureAlign
                  </span>
                  <span style={{
                    fontSize:      "11px",
                    fontWeight:    700,
                    background:    "var(--accent-dim)",
                    color:         "var(--accent)",
                    border:        "1px solid var(--accent-glow)",
                    borderRadius:  "99px",
                    padding:       "2px 9px",
                    letterSpacing: "0.04em",
                  }}>
                    AI
                  </span>
                </Link>

                {/* Theme toggle — standalone, outside all Link elements */}
                <ThemeToggle />

                <div style={{ display:"flex", gap:"2px" }}>
                  {[
                    { href:"/",        label:"Analyze", icon:"🔍" },
                    { href:"/compare", label:"Compare", icon:"📊" },
                    { href:"/history", label:"History", icon:"📜" },
                    { href:"/favorites", label:"Saved", icon:"⭐" },
                  ].map(({ href, label, icon }) => (
                    <Link key={href} href={href} className="nav-link">
                      <span style={{ fontSize:"13px" }}>{icon}</span>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <main style={{
              maxWidth: "1240px",
              margin:   "0 auto",
              padding:  "48px 28px 80px",
            }}>
              {children}
            </main>

          </ThemeProvider>
          <div
            id="global-tooltip"
            style={{
              position: "fixed",
              top: "0px",
              left: "0px",
              width: "260px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px",
              fontSize: "12px",
              color: "var(--text-2)",
              boxShadow: "var(--shadow-card)",
              pointerEvents: "none",
              opacity: 0,
              transition: "opacity 0.15s ease",
              zIndex: 9999,
            }}
          ></div>
        </LanguageProvider>
      </body>
    </html>
  );
}