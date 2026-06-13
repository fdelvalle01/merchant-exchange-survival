import { useEffect, useMemo, useState } from "react";
import { changeFor, money, percentFor, valueClass } from "../marketUtils";
import { getPriceHistory, type PriceHistoryPoint } from "../services/priceHistoryApi";
import type { DesktopAppRenderProps, TradingInstrument } from "../types";
import { AssetIcon } from "../visualCatalog";

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function DetailMetric({
  label,
  value,
  className = ""
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="mes-plate">
      <div className="mes-plate__label">{label}</div>
      <div className={`mes-plate__value ${className}`}>{value}</div>
    </div>
  );
}

function ProductImage({ product }: { product: TradingInstrument }) {
  if (!product.imageUrl) {
    return (
      <div className="mes-asset-image mes-asset-image--icon">
        <AssetIcon
          name={product.name}
          sector={product.sector}
          className="mes-asset-icon--hero"
        />
      </div>
    );
  }

  return (
    <div className="mes-asset-image">
      <img
        src={product.imageUrl}
        alt={product.name}
      />
    </div>
  );
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function HistoryBars({ history }: { history: PriceHistoryPoint[] }) {
  const range = useMemo(() => {
    const prices = history.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, spread: Math.max(max - min, 1) };
  }, [history]);

  return (
    <div className="mes-history-bars">
      {history.map((point, index) => {
        const height = 18 + ((point.price - range.min) / range.spread) * 72;

        return (
          <span
            key={`${point.timestamp}-${index}`}
            title={`${formatHistoryTime(point.timestamp)} ${money.format(point.price)}`}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}

export default function ProductDetailApp({
  currentUser,
  selectedProduct,
  onOpenApp,
  isActive
}: DesktopAppRenderProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedProduct) {
      setHistory([]);
      setHistoryError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);
    setHistoryError(null);

    getPriceHistory(selectedProduct.id, 80)
      .then((points) => {
        if (!isMounted) return;
        setHistory(points);
      })
      .catch((error) => {
        console.error("Price history load failed", error);
        if (!isMounted) return;
        setHistory([]);
        setHistoryError("No se pudo cargar price_history.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [historyReloadKey, selectedProduct?.id]);

  if (!selectedProduct) {
    return (
      <section className="mes-app" data-active={isActive}>
        <div className="mes-state min-h-[260px]">
          <div>
            <h2 className="mes-state__title">
              Asset Chronicle
            </h2>
            <p className="mes-state__copy">
              Select an asset from Market Board to open its chronicle.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const change = changeFor(selectedProduct);
  const changePercent = percentFor(selectedProduct);
  const trendClass = valueClass(changePercent);
  const enabledLabel = selectedProduct.enabled === false ? "Disabled" : "Enabled";
  const enabledClass = selectedProduct.enabled === false ? "mes-negative" : "mes-positive";
  const canOpenTicket = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Asset Chronicle
          </h2>
          <p className="mes-app__subtitle">Selected instrument, history and exchange standing</p>
        </div>
        <div className="mes-code-badge">
          PD-01
        </div>
      </div>

      <div className="mes-app__body">
        <div className="mes-asset-hero">
          <ProductImage product={selectedProduct} />

          <div className="mes-asset-summary">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mes-plate__label">
                  Selected Asset
                </div>
                <h3 className="mes-asset-summary__name">
                  <AssetIcon
                    name={selectedProduct.name}
                    sector={selectedProduct.sector}
                  />
                  {selectedProduct.name}
                </h3>
              </div>
              <div className={`mes-tag ${enabledClass}`}>
                {enabledLabel}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <div className="mes-asset-summary__price">
                  {money.format(selectedProduct.currentPrice)}
                </div>
              </div>
              <div className={`font-mono text-sm ${trendClass}`}>
                {changePercent > 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </div>
            </div>

            <button
              type="button"
              disabled={!canOpenTicket}
              onClick={() => onOpenApp("ticket")}
              className="mes-button mt-4"
              title={canOpenTicket ? "Open Royal Ticket" : "Ticket restricted by role"}
            >
              Open Royal Ticket
            </button>
          </div>
        </div>

        <div className="mes-plate-grid">
          <DetailMetric label="Base Price" value={money.format(selectedProduct.basePrice)} />
          <DetailMetric
            label="Change"
            value={`${change > 0 ? "+" : ""}${money.format(change)}`}
            className={valueClass(change)}
          />
          <DetailMetric
            label="Change %"
            value={`${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
            className={trendClass}
          />
          <DetailMetric
            label="Peak"
            value={money.format(selectedProduct.maxPrice ?? selectedProduct.currentPrice)}
          />
          <DetailMetric label="Created" value={formatDate(selectedProduct.createdAt)} />
          <DetailMetric label="Last Trade" value={formatDate(selectedProduct.lastPurchasedAt)} />
        </div>

        <div className="mes-panel">
          <div className="mes-panel__header">
            <div>
              <div className="mes-panel__title">
                Price History
              </div>
              <p className="mes-app__subtitle">
                Latest {history.length} records from /api/price-history
              </p>
            </div>
          </div>

          <div>
            {isLoadingHistory && (
              <div className="mes-state min-h-[96px]">
                Loading price_history...
              </div>
            )}
            {!isLoadingHistory && historyError && (
              <div className="mes-state min-h-[96px]">
                <div>
                  <div className="mes-negative">{historyError}</div>
                  <button
                    type="button"
                    className="mes-button mes-button--compact mt-3"
                    onClick={() => setHistoryReloadKey((current) => current + 1)}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {!isLoadingHistory && !historyError && history.length === 0 && (
              <div className="mes-state min-h-[96px]">
                No price history has been recorded for this asset.
              </div>
            )}
            {!isLoadingHistory && !historyError && history.length > 0 && (
              <HistoryBars history={history} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
