"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavbarLinks() {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[
        { href: "/", label: "Analyze", icon: "🔍" },
        { href: "/compare", label: "Compare", icon: "📊" },
        { href: "/history", label: "History", icon: "📜" },
        { href: "/favorites", label: "Saved", icon: "⭐" },
        { href: "/cineai", label: "CineAI", icon: "🎬" },
      ].map(({ href, label, icon }) => {
        const active = pathname === href;

        // FULL reload ONLY for Analyze page
        if (href === "/") {
          return (
            <a
              key={href}
              href="/"
              className="nav-link"
              style={{
                color: active ? "#f7d58a" : "var(--text-3)",
                background: active
                  ? "rgba(224,170,94,0.10)"
                  : "transparent",
                border: active
                  ? "1px solid rgba(224,170,94,0.22)"
                  : "1px solid transparent",
                boxShadow: active
                  ? "0 0 18px rgba(224,170,94,0.12)"
                  : "none",
              }}
            >
              <span style={{ fontSize: "13px" }}>{icon}</span>
              {label}
            </a>
          );
        }

        // Normal Next.js routing for other pages
        return (
          <Link
            key={href}
            href={href}
            className="nav-link"
            style={{
              color: active ? "#f7d58a" : "var(--text-3)",
              background: active
                ? "rgba(224,170,94,0.10)"
                : "transparent",
              border: active
                ? "1px solid rgba(224,170,94,0.22)"
                : "1px solid transparent",
              boxShadow: active
                ? "0 0 18px rgba(224,170,94,0.12)"
                : "none",
            }}
          >
            <span style={{ fontSize: "13px" }}>{icon}</span>
            {label}
          </Link>
        );
      })}
    </div>
  );
}