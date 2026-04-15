import { useState, useEffect } from "react";
import { Lang, translations }  from "@/lib/i18n";

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("ca_lang") as Lang | null;
    if (stored) setLang(stored);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("ca_lang", l);
  };

  const t = (key: string): string =>
    translations[lang]?.[key] ?? translations.en[key] ?? key;

  return { lang, changeLang, t };
}