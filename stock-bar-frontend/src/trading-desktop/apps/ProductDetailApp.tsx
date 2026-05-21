import { changeFor, money, percentFor, valueClass } from "../marketUtils";
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

export default function ProductDetailApp({
  selectedProduct,
  onOpenApp
}: DesktopAppRenderProps) {
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
              Product Detail
            </h2>
            <p className="mt-3 max-w-sm text-sm text-stone-500">
              Selecciona un producto desde Market Board para ver el detalle.
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
            Product Detail
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
                  Selected Product
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
              onClick={() => onOpenApp("ticket")}
              className="mt-4 rounded-md border border-amber-600/70 bg-amber-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25"
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
          <DetailMetric label="Last Purchase" value={formatDate(selectedProduct.lastPurchasedAt)} />
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                Price chart coming soon
              </div>
              <p className="mt-1 text-xs text-stone-600">
                El historial detallado se conectara en un requerimiento posterior.
              </p>
            </div>
            <div className="hidden h-10 items-end gap-1 sm:flex">
              {[35, 48, 44, 62, 58, 76, 70].map((height, index) => (
                <span
                  key={index}
                  className="w-3 rounded-t bg-amber-500/35"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
