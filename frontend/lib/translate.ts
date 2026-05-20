/**
 * MyMemory Translation API — free, no API key needed, reliable
 * https://api.mymemory.translated.net
 */

export type SupportedLang = "en" | "hi" | "es" | "ja" | "fr" | "de" | "ar" | "ko";

const LANG_MAP: Record<SupportedLang, string> = {
  en: "en",
  hi: "hi",
  es: "es",
  ja: "ja",
  fr: "fr",
  de: "de",
  ar: "ar",
  ko: "ko",
};

/**
 * Translate a single string using MyMemory API.
 * Returns original string on any failure — never crashes the UI.
 */
export async function translateText(
  text: string,
  target: SupportedLang,
  source: SupportedLang = "en"
): Promise<string> {
  if (!text || !text.trim() || target === source || target === "en") return text;

  try {
    const sourceLang = LANG_MAP[source];
    const targetLang = LANG_MAP[target];
    const langPair = `${sourceLang}|${targetLang}`;

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text.substring(0, 500)); // API limit
    url.searchParams.set("langpair", langPair);

    console.log(`[Translation] Requesting: ${langPair} - "${text.substring(0, 50)}..."`);
    
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!res.ok) {
      console.warn(`[Translation] HTTP Error: ${res.status}`);
      return text;
    }

    const data = (await res.json()) as any;

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText as string;
      console.log(`[Translation] Success: "${translated.substring(0, 50)}..."`);
      return translated;
    }

    console.warn(`[Translation] API returned status: ${data.responseStatus}`);
    return text;
  } catch (e) {
    console.error("[Translation] Error:", e instanceof Error ? e.message : String(e));
    return text; // fallback to original
  }
}

/**
 * Translate multiple strings efficiently using Promise.all.
 * Each string gets its own request to avoid rate limiting.
 */
export async function translateBatch(
  texts: string[],
  target: SupportedLang,
  source: SupportedLang = "en"
): Promise<string[]> {
  if (target === "en" || target === source) return texts;

  // Filter out empty strings
  const nonEmpty = texts.map((t, i) => ({ i, t })).filter(({ t }) => t.trim());

  if (nonEmpty.length === 0) return texts;

  console.log(`[translateBatch] Translating ${nonEmpty.length} strings to ${target}`);

  // Translate in parallel with Promise.all
  const promises = nonEmpty.map(({ t }) =>
    translateText(t, target, source)
  );

  try {
    const translated = await Promise.all(promises);
    console.log(`[translateBatch] All ${translated.length} translations completed`);

    // Reconstruct original array with translations in place
    const result = [...texts];
    nonEmpty.forEach(({ i }, idx) => {
      result[i] = translated[idx] ?? texts[i];
    });

    return result;
  } catch (e) {
    console.error("[translateBatch] Error:", e instanceof Error ? e.message : String(e));
    return texts; // fallback to original
  }
}

/**
 * Check if translation API is available.
 */
export async function checkTranslateAvailable(): Promise<boolean> {
  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", "hello");
    url.searchParams.set("langpair", "en|es");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
