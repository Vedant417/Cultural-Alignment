"use client";

import { useEffect, useState } from "react";
import { useLanguage } from \"@/hooks/useLanguage\";
import { getGroupedHistory } from \"@/lib/api\";
import HistoryTable from \"@/components/HistoryTable\";
import LanguageSwitcher from \"@/components/LanguageSwitcher\";
import { COUNTRIES } from "@/components/CountrySelector";

type HistoryEntry = {
  id: string;
  target_region: string;
  score: number | null;
  label: string;
  reason: string;
  searched_at: string;
};

type GroupedHistory = {
  title: string;
  poster_url: string;
  language: string;
  release_date: string;
  latest_date: string;
  entries: HistoryEntry[];
};

export default function HistoryPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATE
  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] =
    useState<"all" | "high" | "mid" | "low">("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [sortBy, setSortBy] =
    useState<"latest" | "highest">("latest");

  // Fetch data
  useEffect(() => {
    getGroupedHistory()
      .then((data) => {
        setGroups(data);
      })
      .catch((err) => {
        console.error("History fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ FILTERING LOGIC
  const filteredGroups = groups
    .filter((g) => {
      if (search && !g.title.toLowerCase().includes(search.toLowerCase()))
        return false;

      if (filterCountry !== "all") {
        if (!g.entries.some((e) => e.target_region === filterCountry))
          return false;
      }

      if (filterScore !== "all") {
        const inRange = g.entries.some((e) => {
          const s = e.score ?? 0;
          if (filterScore === "high") return s >= 8;
          if (filterScore === "mid") return s >= 4 && s < 8;
          if (filterScore === "low") return s < 4;
          return true;
        });
        if (!inRange) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "highest") {
        const maxA = Math.max(...a.entries.map((e) => e.score ?? 0));
        const maxB = Math.max(...b.entries.map((e) => e.score ?? 0));
        return maxB - maxA;
      }
      return b.latest_date > a.latest_date ? 1 : -1;
    });

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
            {t("history_title")}
          </h1>

          <p style={{ color: "var(--text-2)" }}>
            {t("history_subtitle")}
          </p>
        </div>
        <LanguageSwitcher compact />
      </div>

      {/* ── CONTROLS BAR ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "12px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--input-bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              outline: "none",
              fontSize: "13px",
            }}
          />
        </div>

        {/* Score filter */}
        <select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value as any)}
          style={{
            height: "38px",
            borderRadius: "10px",
            padding: "0 12px",
            background: "var(--input-bg)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: "13px",
          }}
        >
          <option value="all">{t("filter_all_scores")}</option>
          <option value="high">{t("filter_high")}</option>
          <option value="mid">{t("filter_mid")}</option>
          <option value="low">{t("filter_low")}</option>
        </select>

        {/* Country filter */}
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={{
            height: "38px",
            borderRadius: "10px",
            padding: "0 12px",
            background: "var(--input-bg)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: "13px",
          }}
        >
          <option value="all">{t("filter_all_countries")}</option>
          {COUNTRIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "var(--bg-deep)",
            borderRadius: "10px",
            padding: "4px",
          }}
        >
          {(["latest", "highest"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: "5px 12px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                background: sortBy === s ? "var(--accent)" : "transparent",
                color: sortBy === s ? "#fff" : "var(--text-2)",
                fontWeight: sortBy === s ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {s === "latest" ? t("sort_latest") : t("sort_highest")}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p style={{ color: "var(--text-2)" }}>{t("loading")}</p>
      ) : !filteredGroups.length ? (
        <div
          style={{
            padding: "60px",
            textAlign: "center",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            color: "var(--text-3)",
          }}
        >
          <p>{t("no_history")}</p>
          <p style={{ fontSize: "14px" }}>{t("no_history_sub")}</p>
        </div>
      ) : (
        <HistoryTable data={filteredGroups} />
      )}
    </div>
  );
}