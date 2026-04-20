"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, translations } from "@/lib/i18n";

interface LangContextValue {
  lang:       Lang;
  changeLang: (l: Lang) => void;
  t:          (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang:       "en",
  changeLang: () => {},
  t:          (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
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

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// This is the hook all components use
export function useLanguage() {
  return useContext(LangContext);
}