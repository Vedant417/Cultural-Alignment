import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Film, History, Sparkles } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora  = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title:       "CultureAlign — AI Cultural Analysis",
  description: "Discover how well a movie fits the culture of its production region.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body
        className="bg-[#0f1117] text-slate-200 min-h-screen antialiased"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-[#2d3348] bg-[#0f1117]/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span
                className="font-extrabold text-lg text-slate-100"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                CultureAlign
              </span>
              <span className="hidden sm:flex items-center gap-1 text-xs bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-[#1e2130] transition-all"
              >
                Analyze
              </Link>
              <Link
                href="/history"
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-[#1e2130] transition-all flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Main ───────────────────────────────────── */}
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}