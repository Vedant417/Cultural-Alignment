import { getGroupedHistory } from "@/lib/api";
import HistoryTable from "@/components/HistoryTable";

export const dynamic = "force-dynamic";

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

export default async function HistoryPage() {
  let data: GroupedHistory[] = [];

  try {
    data = await getGroupedHistory();
    console.log("History data:", data);
  } catch (err) {
    console.error("History fetch failed:", err);
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
          📜 Analysis History
        </h1>

        <p style={{ color: "var(--text-2)" }}>
          {data.length} movies analyzed
        </p>
      </div>

      {!data.length ? (
        <div style={{
          padding: "60px",
          textAlign: "center",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          color: "var(--text-3)",
        }}>
          No analyses yet.
        </div>
      ) : (
        <HistoryTable data={data} />
      )}
    </div>
  );
}