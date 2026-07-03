import type { Metadata } from "next";
import "./globals.css";
import Link                from "next/link";
import ThemeToggle         from "@/components/ThemeToggle";
import { LanguageProvider } from "@/hooks/useLanguage";
import NavbarLinks from "@/components/NavbarLinks";

export const metadata: Metadata = {
  title:       "CultureAlign — AI Cultural Analysis",
  description: "Analyze how well a movie fits any country's culture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* Prevent flash: set theme before render */}
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>

            <nav className="ca-navbar" style={{
              position:        "sticky",
              top:             0,
              zIndex:          100,
              backgroundColor: "var(--nav-bg)",
              borderBottom:    "1px solid var(--border)",
              background: "rgba(3,7,18,0.96)",
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flexShrink: 0,
                  }}
                >
                  {/* Clickable Logo + CultureAlign */}
                  <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                    {/* Logo Icon */}
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #e0aa5e 0%, #b8860b 100%)",
                        boxShadow: "0 4px 18px rgba(224,170,94,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      🎬
                    </div>

                    <span
                      style={{
                        fontFamily: "Sora, sans-serif",
                        fontWeight: 800,
                        fontSize: "18px",
                        color: "#ffffff",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      CultureAlign
                    </span>
                  </div>

                  {/* & Symbol */}
                  <span
                    style={{
                      color: "#8b8b8b",
                      fontSize: "18px",
                      fontWeight: 600,
                    }}
                  >
                    &
                  </span>

                  {/* NON-CLICKABLE CineAI */}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      background: "rgba(224,170,94,0.12)",
                      color: "#e0aa5e",
                      border: "1px solid rgba(224,170,94,0.25)",
                      borderRadius: "999px",
                      padding: "6px 14px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    CineAI
                  </span>
                </div>

                {/* Theme toggle — standalone, outside all Link elements */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ThemeToggle />
                  <NavbarLinks />
                </div>

                </div>
            </nav>

            <main style={{
              maxWidth: "1380px",
              margin: "0 auto",
              padding: "42px 32px 120px",
            }}>
              {children}
            </main>

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