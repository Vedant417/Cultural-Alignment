/**
 * useTranslation — translates AI-generated content when language changes.
 *
 * Separates two types of text:
 *   1. Static UI labels   → from i18n.ts (already in correct language, instant)
 *   2. AI-generated text  → from Ollama/Groq (always English, needs MyMemory API)
 *
 * Usage:
 *   const { translateContent, isTranslating } = useTranslation();
 *   const translated = await translateContent(analysisResult, lang);
 */
"use client";
import { useState, useCallback }   from "react";
import { translateBatch }          from "@/lib/translate";
import type { SupportedLang }      from "@/lib/translate";
import type { AnalysisResult, ComparisonEntry, MovieInfo } from "@/types";

interface TranslatedResult {
  reason:        string;
  audience_note: string;
  label:         string;
  similar_movies: { title: string; reason: string }[];
}

interface TranslatedEntry {
  region:  string;
  score:   number | null;
  label:   string;
  reason:  string;
  cached:  boolean;
}

interface TranslatedMovie {
  title:    string;
  overview: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  /**
   * Translate an AnalysisResult's AI-generated fields.
   * Returns a new object with translated strings — original is not mutated.
   */
  const translateResult = useCallback(async (
    result: AnalysisResult,
    lang:   SupportedLang
  ): Promise<TranslatedResult> => {
    if (lang === "en") {
      return {
        reason:        result.reason,
        audience_note: result.audience_note,
        label:         result.label,
        similar_movies: result.similar_movies,
      };
    }

    setIsTranslating(true);
    try {
      // Collect all strings that need translation
      const similarReasons = result.similar_movies.map((m) => m.reason);
      const allStrings = [
        result.reason,
        result.audience_note,
        result.label,
        ...similarReasons,
      ];

      console.log(`[translateResult] Translating ${allStrings.length} strings to ${lang}`);
      console.log(`[translateResult] Strings: ${allStrings.map(s => `"${s.substring(0, 30)}..."`).join(", ")}`);
      
      const translated = await translateBatch(allStrings, lang);
      console.log(`[translateResult] Success. First translation: "${translated[0]?.substring(0, 50)}..."`);

      return {
        reason:        translated[0] || result.reason,
        audience_note: translated[1] || result.audience_note,
        label:         translated[2] || result.label,
        similar_movies: result.similar_movies.map((m, i) => ({
          title:  m.title,   // titles stay in original language
          reason: translated[3 + i] ?? m.reason,
        })),
      };
    } catch (e) {
      console.error(`[translateResult] Error:`, e instanceof Error ? e.message : String(e));
      setIsTranslating(false);
      return {
        reason:        result.reason,
        audience_note: result.audience_note,
        label:         result.label,
        similar_movies: result.similar_movies,
      };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  /**
   * Translate comparison entries (from compare page).
   */
  const translateEntries = useCallback(async (
    entries: ComparisonEntry[],
    lang:    SupportedLang
  ): Promise<TranslatedEntry[]> => {
    if (lang === "en") return entries.map(e => ({
      region: e.region,
      score: e.score,
      label: e.label,
      reason: e.reason ?? "",
      cached: false
    }));

    setIsTranslating(true);
    try {
      const reasons = entries.map((e) => e.reason ?? "");
      const labels  = entries.map((e) => e.label ?? "");
      const allStrings = [...reasons, ...labels];

      const translated = await translateBatch(allStrings, lang);
      const half = entries.length;

      return entries.map((e, i) => ({
        region: e.region,
        score: e.score,
        reason: translated[i] ?? e.reason ?? "",
        label: translated[half + i] ?? e.label ?? "",
        cached: false
      }));
    } finally {
      setIsTranslating(false);
    }
  }, []);

  /**
   * Translate movie title and overview from TMDB.
   * Returns a new object with translated title and overview.
   */
  const translateMovie = useCallback(async (
    movie: MovieInfo,
    lang:  SupportedLang
  ): Promise<TranslatedMovie> => {
    if (lang === "en") {
      return {
        title:    movie.title,
        overview: movie.overview,
      };
    }

    setIsTranslating(true);
    try {
      const allStrings = [movie.title, movie.overview];
      const translated = await translateBatch(allStrings, lang);

      return {
        title:    translated[0] || movie.title,
        overview: translated[1] || movie.overview,
      };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translateResult, translateEntries, translateMovie, isTranslating };
}
