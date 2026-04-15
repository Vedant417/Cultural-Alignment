"use client";
import { useState } from "react";

interface Props {
  movieTitle: string;
  region:     string;
  score:      number | null;
  label:      string;
}

export default function ShareCard({ movieTitle, region, score, label }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/analyze?title=${encodeURIComponent(movieTitle)}&region=${encodeURIComponent(region)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `🎬 ${movieTitle} — Cultural Fit for ${region}: ${score}/10 (${label})\n\n🔗 ${shareUrl}`;

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: `CultureAlign — ${movieTitle}`, url: shareUrl, text: shareText });
    } else {
      copyLink();
    }
  };

  return (
    <div style={{
      display:      "flex",
      gap:          "8px",
      marginTop:    "14px",
      flexWrap:     "wrap",
    }}>
      <button onClick={copyLink} style={{
        fontSize: "12px", fontWeight: 700,
        background: "var(--bg-deep)", color: "var(--text-2)",
        border: "1px solid var(--border)", borderRadius: "8px",
        padding: "6px 12px", cursor: "pointer",
      }}>
        {copied ? "✅ Copied!" : "🔗 Copy link"}
      </button>

      <button onClick={shareNative} style={{
        fontSize: "12px", fontWeight: 700,
        background: "var(--accent-dim)", color: "var(--accent)",
        border: "1px solid var(--accent-glow)", borderRadius: "8px",
        padding: "6px 12px", cursor: "pointer",
      }}>
        ↗ Share
      </button>
    </div>
  );
}