import { MovieInfo } from "@/types";
import Image from "next/image";

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",    hi: "Hindi",      ta: "Tamil",
  te: "Telugu",     ml: "Malayalam",  kn: "Kannada",
  mr: "Marathi",    bn: "Bengali",    fr: "French",
  es: "Spanish",    de: "German",     ja: "Japanese",
  ko: "Korean",     zh: "Chinese",    it: "Italian",
  pt: "Portuguese", ru: "Russian",    ar: "Arabic",
  tr: "Turkish",
};

export default function MovieDetailsCard({ movie }: { movie: MovieInfo }) {
  const lang = LANGUAGE_MAP[movie.language] ?? movie.language.toUpperCase();

  return (
    <div className="bg-[#1e2130] border border-[#2d3348] rounded-2xl overflow-hidden">
      {/* Poster */}
      {movie.poster_url && (
        <div className="relative w-full h-60">
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2130] via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          📽️ Movie Info
        </p>
        <h2
          className="font-extrabold text-xl text-slate-100 mb-4 leading-snug"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          {movie.title}
        </h2>
        <hr className="border-[#2d3348] mb-4" />

        <div className="space-y-3 text-sm">
          <Row icon="📅" label="Released" value={movie.release_date || "N/A"} />
          <Row icon="🌐" label="Language"  value={lang} />
          <Row icon="📖" label="Overview"  value={movie.overview || "No overview available."} />
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-base mt-0.5">{icon}</span>
      <span className="text-slate-500 font-semibold min-w-[80px] flex-shrink-0">{label}</span>
      <span className="text-slate-300 leading-relaxed">{value}</span>
    </div>
  );
}