import { getGroupedHistory } from "@/lib/api";
import HistoryTable from "@/components/HistoryTable";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let groupedData: Awaited<ReturnType<typeof getGroupedHistory>> = [];

  try {
    groupedData = await getGroupedHistory();
  } catch {
    // backend offline
  }


  const flatData = Array.isArray(groupedData)
    ? groupedData.flatMap((group: any) => {
        // detect correct property dynamically
        if (Array.isArray(group.items)) return group.items;
        if (Array.isArray(group.data)) return group.data;
        if (Array.isArray(group.history)) return group.history;
        return [];
      })
    : [];

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 800,
            fontSize: "30px",
            color: "#f0f4ff",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          📜 Analysis History
        </h1>

        <p style={{ color: "#4b5a73", fontSize: "14px" }}>
          {flatData.length} movie{flatData.length !== 1 ? "s" : ""} analyzed —
          click any movie to load it on the Analyze page.
          Hover over a country to see its reasoning.
        </p>
      </div>

      {/* ✅ Correct type passed */}
      <HistoryTable data={flatData} />
    </div>
  );
}