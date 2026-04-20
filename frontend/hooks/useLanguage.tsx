"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, translations } from "@/lib/i18n";

interface LangContextValue {
  lang:       Lang;
  changeLang: (l: Lang) => void;
  t:          (key: string) => string;
  translateAsync: (text: string, targetLang?: Lang) => Promise<string>;
  clearTranslationCache: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang:       "en",
  changeLang: () => {},
  t:          (k) => k,
  translateAsync: async (text) => text,
  clearTranslationCache: () => {},
});

// Translation cache: key -> Map<language -> translation>
const translationCache = new Map<string, Map<string, string>>();

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ca_lang") as Lang | null;
      if (stored && ["en","hi","es","ja"].includes(stored)) setLang(stored);
    } catch {}
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("ca_lang", l); } catch {}
  };

  const t = (key: string): string =>
    translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;

  const translateAsync = async (text: string, targetLang?: Lang): Promise<string> => {
    const target = targetLang || lang;

    // Return original for English
    if (target === "en") return text;
    
    // Return original if text is empty
    if (!text || !text.trim()) return text;

    // Check cache first
    const textHash = text.substring(0, 100);
    if (translationCache.has(textHash)) {
      const langMap = translationCache.get(textHash)!;
      if (langMap.has(target)) {
        return langMap.get(target)!;
      }
    }

    try {
      // Call backend translation API
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          target_language: target,
          source_language: "en",
        }),
      });

      if (!response.ok) {
        console.warn(`Translation API error: ${response.status}`);
        return text; // Fallback to original
      }

      const data = await response.json();
      const translated = data.translated || text;

      // Cache result
      if (!translationCache.has(textHash)) {
        translationCache.set(textHash, new Map());
      }
      translationCache.get(textHash)!.set(target, translated);

      return translated;
    } catch (error) {
      console.warn("Translation failed:", error);
      return text; // Fallback to original
    }
  };

  const clearTranslationCache = () => {
    translationCache.clear();
  };

  return (
    <LangContext.Provider value={{ lang, changeLang, t, translateAsync, clearTranslationCache }}>
      {children}
    </LangContext.Provider>
  );
}

// This is the hook all components use
export function useLanguage() {
  return useContext(LangContext);
}
