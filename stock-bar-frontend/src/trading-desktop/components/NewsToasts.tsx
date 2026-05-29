import { FaTimes } from "react-icons/fa";
import { valueClass } from "../marketUtils";
import {
  holdingImpactClass,
  holdingImpactMeta,
  newsAffectsHolding,
  newsImpactLabel
} from "../newsUtils";
import type { NewsSeverity, PortfolioHoldingResponse, TradingInstrument, WorldNewsItem } from "../types";

type NewsToastsProps = {
  items: WorldNewsItem[];
  portfolio: PortfolioHoldingResponse[];
  products: TradingInstrument[];
  onDismiss: (id: number) => void;
  onOpenNews: () => void;
};

function severityClass(severity: NewsSeverity) {
  if (severity === "CRITICAL") return "border-red-500/70 bg-red-500/15 text-red-100";
  if (severity === "HIGH") return "border-orange-500/70 bg-orange-500/15 text-orange-100";
  if (severity === "MEDIUM") return "border-amber-500/70 bg-amber-500/15 text-amber-100";
  return "border-emerald-500/70 bg-emerald-500/15 text-emerald-100";
}

function impactLabel(news: WorldNewsItem) {
  return newsImpactLabel(news);
}

export default function NewsToasts({
  items,
  portfolio,
  products,
  onDismiss,
  onOpenNews
}: NewsToastsProps) {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[9999] grid w-[340px] max-w-[calc(100vw-2rem)] gap-2">
      {items.slice(0, 3).map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-md border p-3 shadow-2xl backdrop-blur ${severityClass(item.severity)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onOpenNews}
              className="min-w-0 flex-1 text-left"
              title="Open Guild Herald"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
                Guild Herald
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-stone-100">{item.title}</div>
              <div className="mt-1 text-xs text-stone-300">{item.summary}</div>
              {newsAffectsHolding(item, portfolio, products) &&
                (() => {
                  const impactMeta = holdingImpactMeta(item.direction);
                  return (
                    <div className={`mt-2 rounded border px-2 py-1 text-[11px] font-semibold ${holdingImpactClass(impactMeta.tone)}`}>
                      {impactMeta.toastMessage}
                    </div>
                  );
                })()}
              <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[11px]">
                <span className="truncate text-stone-400">
                  {item.affectedAssetName ?? item.affectedSector ?? "Kingdom Market"}
                </span>
                <span className={item.direction === "MIXED" ? "text-amber-200" : valueClass(item.impactPercent)}>
                  {impactLabel(item)}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded border border-white/10 bg-black/20 text-[10px] text-stone-300 hover:text-stone-100"
              title="Dismiss"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
      {items.length > 3 && (
        <button
          type="button"
          onClick={onOpenNews}
          className="pointer-events-auto rounded border border-[#3b2a1f] bg-black/75 px-3 py-2 text-xs font-semibold text-amber-100 shadow-2xl"
        >
          {items.length - 3} more news alerts
        </button>
      )}
    </div>
  );
}
