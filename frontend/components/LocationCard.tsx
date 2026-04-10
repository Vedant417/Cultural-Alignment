import { RegionInfo } from "@/types";
import { MapPin, ExternalLink } from "lucide-react";

export default function LocationCard({ region }: { region: RegionInfo }) {
  const query   = region.state ? `${region.state}, ${region.region}` : region.region;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        📍 Detected Origin
      </p>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div
            className="text-xl font-extrabold text-slate-100"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {region.region || "Not Detected"}
          </div>
          {region.state && (
            <div className="text-sm text-slate-400 mt-0.5">{region.state}</div>
          )}
          <div className="text-xs text-slate-600 mt-1">
            {region.lat.toFixed(4)}, {region.lon.toFixed(4)}
          </div>
        </div>
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold
                   text-blue-400 hover:text-blue-300
                   bg-blue-950/40 border border-blue-900 hover:border-blue-700
                   px-4 py-2.5 rounded-lg transition-all"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View on Google Maps
      </a>
    </div>
  );
}