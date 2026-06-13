import { FaTimes } from "react-icons/fa";
import { valueClass } from "../marketUtils";
import {
  holdingImpactClass,
  holdingImpactMetaForNews,
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
  if (severity === "CRITICAL") return "mes-news-toast--critical";
  if (severity === "LOW") return "mes-news-toast--low";
  return "";
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
    <div className="mes-news-toast-stack">
      {items.slice(0, 3).map((item) => {
        const impactMeta = holdingImpactMetaForNews(item, portfolio, products);

        return (
          <div
            key={item.id}
            className={`mes-news-toast ${severityClass(item.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={onOpenNews}
                className="min-w-0 flex-1 text-left"
                title="Open Guild Herald"
              >
                <div className="mes-news-toast__label">
                  Guild Herald
                </div>
                <div className="mes-news-toast__title">{item.title}</div>
                <div className="mes-news-toast__copy">{item.summary}</div>
                {impactMeta && (
                  <div className={`mt-2 rounded border px-2 py-1 text-[11px] font-semibold ${holdingImpactClass(impactMeta.tone)}`}>
                    {impactMeta.hint}
                  </div>
                )}
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
                className="mes-icon-button"
                title="Dismiss"
                aria-label={`Dismiss ${item.title}`}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
      {items.length > 3 && (
        <button
          type="button"
          onClick={onOpenNews}
          className="mes-button pointer-events-auto"
        >
          {items.length - 3} more news alerts
        </button>
      )}
    </div>
  );
}
