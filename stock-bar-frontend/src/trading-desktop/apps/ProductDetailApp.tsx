import { useEffect, useMemo, useState } from "react";
import { changeFor, money, percentFor, valueClass } from "../marketUtils";
import { getPriceHistory, type PriceHistoryPoint } from "../services/priceHistoryApi";
import type { DesktopAppRenderProps, TradingInstrument } from "../types";

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
  className = "text-stone-100"
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{label}</div>
      <div className={`mt-1 font-mono text-sm ${className}`}>{value}</div>
    </div>
  );
}

function ProductImage({ product }: { product: TradingInstrument }) {
  if (!product.imageUrl) {
    return (
      <div className="grid h-32 w-full place-items-center rounded-md border border-[#3b2a1f] bg-black/25 text-xs text-stone-600">
        No image
      </div>
    );
  }

  return (
    <div className="grid h-32 w-full place-items-center rounded-md border border-[#3b2a1f] bg-black/25 p-3">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="max-h-28 max-w-28 rounded object-contain"
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
    <div className="flex h-24 items-end gap-1 overflow-hidden">
      {history.map((point, index) => {
        const height = 18 + ((point.price - range.min) / range.spread) * 72;

        return (
          <span
            key={`${point.timestamp}-${index}`}
            title={`${formatHistoryTime(point.timestamp)} ${money.format(point.price)}`}
            className="min-w-[5px] flex-1 rounded-t bg-amber-500/40"
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
  onOpenApp
}: DesktopAppRenderProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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
  }, [selectedProduct?.id]);

  if (!selectedProduct) {
    return (
      <section
        className="min-h-full rounded-md border border-[#3b2a1f] bg-[#120d09]/95 p-5 shadow-2xl"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(116, 72, 33, 0.10), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
        }}
      >
        <div className="grid min-h-[260px] place-items-center text-center">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
              Asset Detail
            </h2>
            <p className="mt-3 max-w-sm text-sm text-stone-500">
              Selecciona un activo desde Market Board para ver el detalle.
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
  const enabledClass = selectedProduct.enabled === false ? "text-red-300" : "text-emerald-300";
  const canOpenTicket = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");

  return (
    <section
      className="min-h-full rounded-md border border-[#3b2a1f] bg-[#120d09]/95 shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.10), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Asset Detail
          </h2>
          <p className="text-[11px] text-stone-500">Ficha de instrumento seleccionado</p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          PD-01
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
          <ProductImage product={selectedProduct} />

          <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  Selected Asset
                </div>
                <h3 className="mt-1 text-lg font-semibold text-stone-100">
                  {selectedProduct.name}
                </h3>
              </div>
              <div className={`rounded border border-[#3b2a1f] bg-black/30 px-3 py-1 font-mono text-xs ${enabledClass}`}>
                {enabledLabel}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  Current Price
                </div>
                <div className="font-mono text-2xl text-stone-100">
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
              className="mt-4 rounded-md border border-amber-600/70 bg-amber-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              title={canOpenTicket ? "Abrir Investment Ticket" : "Ticket restringido por rol"}
            >
              Buy / Open Ticket
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="rounded-md border border-[#3b2a1f] bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                Price History
              </div>
              <p className="mt-1 text-xs text-stone-600">
                Ultimos {history.length} registros desde /api/price-history.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {isLoadingHistory && (
              <div className="grid h-24 place-items-center text-xs text-stone-500">
                Loading price_history...
              </div>
            )}
            {!isLoadingHistory && historyError && (
              <div className="grid h-24 place-items-center text-xs text-red-300">
                {historyError}
              </div>
            )}
            {!isLoadingHistory && !historyError && history.length === 0 && (
              <div className="grid h-24 place-items-center text-xs text-stone-500">
                Sin registros de historial para este activo.
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
