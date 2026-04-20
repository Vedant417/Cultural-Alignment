"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface TranslatedTextProps {
  text: string;
  variant?: "label" | "body" | "title";
  fallback?: string;
  showSkeleton?: boolean;
}

export default function TranslatedText({
  text,
  variant = "body",
  fallback,
  showSkeleton = true,
}: TranslatedTextProps) {
  const { lang, translateAsync } = useLanguage();
  const [translated, setTranslated] = useState<string>(fallback || text);
  const [loading, setLoading] = useState(lang !== "en" && !fallback);

  useEffect(() => {
    // If language is English or text is same, don't translate
    if (lang === "en" || !text) {
      setTranslated(text);
      setLoading(false);
      return;
    }

    setLoading(true);

    const doTranslate = async () => {
      try {
        const result = await translateAsync(text, lang);
        setTranslated(result || text);
      } catch (error) {
        console.error("Translation error:", error);
        setTranslated(text); // Fallback to original
      } finally {
        setLoading(false);
      }
    };

    doTranslate();
  }, [lang, text, translateAsync]);

  // Skeleton styles
  const skeletonClass =
    variant === "title"
      ? "h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"
      : variant === "label"
        ? "h-4 w-3/4 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"
        : "h-5 w-full bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse";

  if (loading && showSkeleton) {
    return <div className={skeletonClass} />;
  }

  if (variant === "title") {
    return <h3 style={{ color: "var(--text)" }}>{translated}</h3>;
  }

  if (variant === "label") {
    return (
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-2)",
        }}
      >
        {translated}
      </span>
    );
  }

  return (
    <p style={{ color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>
      {translated}
    </p>
  );
}
