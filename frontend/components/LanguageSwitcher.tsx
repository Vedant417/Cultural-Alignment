"use client";
import { useLanguage }          from "@/hooks/useLanguage";
import { Lang, LANG_LABELS }    from "@/lib/i18n";

const LANGS: Lang[] = ["en", "hi", "es", "ja"];

interface Props {
  compact?: boolean; // true = pill row only, false = with label
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const { lang, changeLang, t } = useLanguage();

  return (
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        "8px",
      flexWrap:   "wrap",
    }}>
      {!compact && (
        <span style={{
          fontSize:      "11px",
          fontWeight:    700,
          color:         "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          flexShrink:    0,
        }}>
          {t("switch_language")}:
        </span>
      )}
      <div style={{
        display:      "flex",
        gap:          "4px",
        background:   "var(--bg-deep)",
        borderRadius: "10px",
        padding:      "4px",
      }}>
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => changeLang(l)}
            title={LANG_LABELS[l]}
            style={{
              padding:      "5px 11px",
              borderRadius: "7px",
              border:       "none",
              background:   lang === l ? "var(--accent)"   : "transparent",
              color:        lang === l ? "#fff"             : "var(--text-2)",
              fontWeight:   lang === l ? 700                : 400,
              fontSize:     "12px",
              cursor:       "pointer",
              transition:   "all 0.15s",
              whiteSpace:   "nowrap",
            }}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}