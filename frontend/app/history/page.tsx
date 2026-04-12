
import HistoryTable      from "@/components/HistoryTable";
import { getHistory } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let data: Awaited<ReturnType<typeof getHistory>> = [];
  try {
    data = await getHistory();
  } catch {
    // backend may be offline
  }

  return (
    <div>
      <div style={{ marginBottom:"28px" }}>
        <h1 style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize:"28px",
                     color:"#f0f4ff", marginBottom:"6px" }}>
          📜 Analysis History
        </h1>
        <p style={{ color:"#8896b3", fontSize:"14px" }}>
          All past analyses from MongoDB —{" "}
          <strong style={{ color:"#c8d3ea" }}>{data.length}</strong> record{data.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <HistoryTable data={data} />
    </div>
  );
}