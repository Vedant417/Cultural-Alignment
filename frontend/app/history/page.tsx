import { getHistory } from "@/lib/api";
import HistoryTable from "@/components/HistoryTable";

export const dynamic = "force-dynamic"; // Always fetch fresh from MongoDB

export default async function HistoryPage() {
  let data: Awaited<ReturnType<typeof getHistory>> = [];
  try {
    data = await getHistory();
  } catch {
    // Silently handle backend being offline during SSR
  }

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-extrabold text-3xl text-slate-100 mb-2"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          📜 Analysis History
        </h1>
        <p className="text-slate-500 text-sm">
          All past analyses stored in MongoDB — {data.length} record{data.length !== 1 ? "s" : ""} found.
        </p>
      </div>
      <HistoryTable data={data} />
    </div>
  );
}