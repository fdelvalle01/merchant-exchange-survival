import { FaBolt, FaExclamationTriangle, FaScroll, FaSyncAlt } from "react-icons/fa";
import { valueClass } from "../marketUtils";
import type { DesktopAppRenderProps, NewsSeverity, WorldNewsItem } from "../types";

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function severityClass(severity: NewsSeverity) {
  if (severity === "CRITICAL") return "border-red-500/70 bg-red-500/10 text-red-200";
  if (severity === "HIGH") return "border-orange-500/70 bg-orange-500/10 text-orange-200";
  if (severity === "MEDIUM") return "border-amber-500/70 bg-amber-500/10 text-amber-200";
  return "border-emerald-500/70 bg-emerald-500/10 text-emerald-200";
}

function impactClass(news: WorldNewsItem) {
  if (news.direction === "MIXED") return "text-amber-200";
  if (news.direction === "NEUTRAL") return "text-stone-400";
  return valueClass(news.impactPercent);
}

function impactLabel(news: WorldNewsItem) {
  if (news.direction === "MIXED") return `Mixed ${Math.abs(news.impactPercent).toFixed(1)}%`;
  if (news.direction === "NEUTRAL") return "Neutral";
  return `${news.impactPercent > 0 ? "+" : ""}${news.impactPercent.toFixed(1)}%`;
}

function NewsIcon({ severity }: { severity: NewsSeverity }) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return <FaExclamationTriangle aria-hidden="true" />;
  }
  if (severity === "MEDIUM") {
    return <FaBolt aria-hidden="true" />;
  }
  return <FaScroll aria-hidden="true" />;
}

function NewsCard({ news }: { news: WorldNewsItem }) {
  return (
    <article className="rounded-md border border-[#3b2a1f] bg-black/25 p-3 transition hover:bg-black/35">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded border text-sm ${severityClass(news.severity)}`}>
          <NewsIcon severity={news.severity} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${severityClass(news.severity)}`}>
              {news.severity}
            </span>
            <span className="font-mono text-[11px] text-stone-500">{formatTime(news.timestamp)}</span>
            <span className="font-mono text-[11px] text-stone-600">{news.category}</span>
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-base font-semibold text-stone-100">{news.title}</h3>
            <span className={`shrink-0 font-mono text-sm font-semibold ${impactClass(news)}`}>
              {impactLabel(news)}
            </span>
          </div>

          <p className="mt-1 text-sm text-stone-300">{news.summary}</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">{news.description}</p>

          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
            {(news.affectedAssetName || news.affectedSector) && (
              <span className="rounded border border-[#3b2a1f] bg-[#090604] px-2 py-1 text-stone-300">
                {news.affectedAssetName ?? news.affectedSector}
              </span>
            )}
            <span className="rounded border border-[#3b2a1f] bg-[#090604] px-2 py-1 text-stone-500">
              {news.direction}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GuildHeraldApp({
  worldNews,
  isLoadingNews,
  newsError,
  onNewsChanged,
  isActive
}: DesktopAppRenderProps) {
  return (
    <section
      className={`min-h-full overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.10), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Guild Herald
          </h2>
          <p className="text-[11px] text-stone-500">Latest kingdom market news</p>
        </div>
        <button
          type="button"
          onClick={onNewsChanged}
          className="grid h-7 w-7 place-items-center rounded border border-amber-700/40 bg-black/30 text-amber-300 transition hover:bg-amber-500/10"
          title="Refresh news"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 p-3">
        {isLoadingNews && (
          <div className="rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 text-xs text-stone-500">
            Loading Guild Herald...
          </div>
        )}
        {newsError && (
          <div className="rounded border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {newsError}
          </div>
        )}
        {!isLoadingNews && worldNews.length === 0 && (
          <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-8 text-center text-sm text-stone-500">
            No kingdom news yet.
          </div>
        )}
        {worldNews.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </section>
  );
}
