import { useMemo, useState } from "react";
import { money } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import {
  decreaseProductPrice,
  increaseProductPrice,
  resetMarket,
  resetProductPrice,
  simulateMarketBoom,
  simulateMarketCrash
} from "../services/adminApi";
import { generateRandomNewsEvent, triggerNewsEvent } from "../services/newsApi";
import type {
  DesktopAppRenderProps,
  MarketEvent,
  MarketEventStatus,
  MarketEventType,
  TradingInstrument,
  WorldEventType,
  WorldNewsItem
} from "../types";

type ControlStatus = {
  type: "info" | "success" | "error";
  message: string;
  details?: string;
};

const worldEventButtons: Array<{ type: WorldEventType; label: string }> = [
  { type: "ROYAL_CONTRACT", label: "Royal Contract" },
  { type: "MINING_ACCIDENT", label: "Mining Accident" },
  { type: "PORT_BLOCKADE", label: "Port Blockade" },
  { type: "BANKING_CRISIS", label: "Banking Crisis" },
  { type: "HARVEST_BOOM", label: "Harvest Boom" },
  { type: "PLAGUE_OUTBREAK", label: "Plague Outbreak" },
  { type: "WAR_RUMORS", label: "War Rumors" },
  { type: "MAGIC_DISCOVERY", label: "Magic Discovery" }
];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function statusClass(type: ControlStatus["type"]) {
  if (type === "success") return "text-emerald-300";
  if (type === "error") return "text-red-300";
  return "text-stone-400";
}

function eventStatusClass(status: MarketEventStatus) {
  if (status === "SUCCESS") return "text-emerald-300";
  if (status === "FAILED") return "text-red-300";
  return "text-amber-300";
}

function eventTypeClass(type: MarketEventType) {
  if (
    type === "MINING_ACCIDENT" ||
    type === "PORT_BLOCKADE" ||
    type === "BANKING_CRISIS" ||
    type === "PLAGUE_OUTBREAK"
  ) {
    return "text-red-300";
  }
  if (type === "ROYAL_CONTRACT" || type === "HARVEST_BOOM" || type === "MAGIC_DISCOVERY") {
    return "text-emerald-300";
  }
  if (type === "WAR_RUMORS") return "text-amber-300";
  if (type === "MARKET_CRASH" || type === "PRODUCT_PRICE_DOWN" || type === "ORDER_SELL_FILLED") {
    return "text-red-300";
  }
  if (
    type === "MARKET_BOOM" ||
    type === "PRODUCT_PRICE_UP" ||
    type === "SALE_REGISTERED" ||
    type === "ORDER_BUY_FILLED"
  ) {
    return "text-emerald-300";
  }
  return "text-amber-300";
}

function toProductId(product?: TradingInstrument) {
  if (!product) return null;
  const productId = Number(product.id);
  return Number.isFinite(productId) ? productId : null;
}

function EventRow({ event }: { event: MarketEvent }) {
  return (
    <tr className="border-b border-[#241811] hover:bg-[#20160f]">
      <td className="py-2 pr-2 text-stone-500">{formatTime(event.timestamp)}</td>
      <td className={`px-2 py-2 font-semibold ${eventTypeClass(event.type)}`}>{event.type}</td>
      <td className="px-2 py-2">
        <div className="truncate text-stone-200" title={event.description}>
          {event.description}
        </div>
        {event.details && (
          <div className="truncate text-[10px] text-amber-300/80" title={event.details}>
            {event.details}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-stone-500">{event.user}</td>
      <td className={`pl-2 py-2 text-right ${eventStatusClass(event.status)}`}>
        {event.status}
      </td>
    </tr>
  );
}

export default function AdminMarketControlsApp({
  currentUser,
  products,
  selectedProduct,
  onSelectProduct,
  onProductsChanged,
  onCompanyChanged,
  onPortfolioChanged,
  onNewsChanged,
  onOpenApp,
  marketEvents,
  addMarketEvent,
  clearMarketEvents,
  isActive
}: DesktopAppRenderProps) {
  const [percent, setPercent] = useState(10);
  const [volume, setVolume] = useState(100);
  const [status, setStatus] = useState<ControlStatus>({
    type: "info",
    message: "Admin controls ready"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProduct = useMemo(
    () => selectedProduct ?? products[0],
    [products, selectedProduct]
  );

  function recordLocalEvent(type: MarketEventType, description: string, details?: string) {
    addMarketEvent({
      type,
      description,
      user: currentUser.name,
      status: "LOCAL",
      details
    });
    setStatus({
      type: "success",
      message: description,
      details
    });
  }

  async function runBackendAction({
    type,
    description,
    action
  }: {
    type: MarketEventType;
    description: string;
    action: () => Promise<string>;
  }) {
    setIsSubmitting(true);
    setStatus({
      type: "info",
      message: `Executing ${type}...`
    });

    try {
      const result = await action();
      addMarketEvent({
        type,
        description,
        user: currentUser.name,
        status: "SUCCESS",
        details: result
      });
      setStatus({
        type: "success",
        message: description,
        details: result
      });
      await Promise.all([onProductsChanged(), onCompanyChanged(), onPortfolioChanged()]);
    } catch (error) {
      const apiError = normalizeApiError(error);
      addMarketEvent({
        type,
        description,
        user: currentUser.name,
        status: "FAILED",
        details: apiError.status ? `HTTP ${apiError.status} | ${apiError.details ?? apiError.message}` : apiError.details ?? apiError.message
      });
      setStatus({
        type: "error",
        message: apiError.message,
        details: apiError.details
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runWorldNewsAction({
    type,
    label,
    action
  }: {
    type: WorldEventType;
    label: string;
    action: () => Promise<WorldNewsItem>;
  }) {
    setIsSubmitting(true);
    setStatus({
      type: "info",
      message: `Publishing ${label}...`
    });

    try {
      const news = await action();
      addMarketEvent({
        type,
        description: news.title,
        user: currentUser.name,
        status: "SUCCESS",
        details: `${news.summary} | ${news.impactPercent > 0 ? "+" : ""}${news.impactPercent.toFixed(1)}%`
      });
      setStatus({
        type: "success",
        message: news.title,
        details: news.summary
      });
      await Promise.all([onProductsChanged(), onNewsChanged(), onCompanyChanged(), onPortfolioChanged()]);
      onOpenApp("herald");
    } catch (error) {
      const apiError = normalizeApiError(error);
      addMarketEvent({
        type,
        description: label,
        user: currentUser.name,
        status: "FAILED",
        details: apiError.status ? `HTTP ${apiError.status} | ${apiError.details ?? apiError.message}` : apiError.details ?? apiError.message
      });
      setStatus({
        type: "error",
        message: apiError.message,
        details: apiError.details
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runRandomWorldNewsAction() {
    setIsSubmitting(true);
    setStatus({
      type: "info",
      message: "Publishing random news event..."
    });

    try {
      const news = await generateRandomNewsEvent();
      addMarketEvent({
        type: news.type,
        description: news.title,
        user: currentUser.name,
        status: "SUCCESS",
        details: `${news.summary} | ${news.impactPercent > 0 ? "+" : ""}${news.impactPercent.toFixed(1)}%`
      });
      setStatus({
        type: "success",
        message: news.title,
        details: news.summary
      });
      await Promise.all([onProductsChanged(), onNewsChanged(), onCompanyChanged(), onPortfolioChanged()]);
      onOpenApp("herald");
    } catch (error) {
      const apiError = normalizeApiError(error);
      addMarketEvent({
        type: "WAR_RUMORS",
        description: "Random News Event",
        user: currentUser.name,
        status: "FAILED",
        details: apiError.status ? `HTTP ${apiError.status} | ${apiError.details ?? apiError.message}` : apiError.details ?? apiError.message
      });
      setStatus({
        type: "error",
        message: apiError.message,
        details: apiError.details
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser.roles.includes("ADMIN_BAR")) {
    return (
      <section className="grid min-h-full place-items-center rounded-md border border-[#3b2a1f] bg-[#120d09]/95 p-5 text-center shadow-2xl">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Game Master Controls
          </h2>
          <p className="mt-3 max-w-sm text-sm text-red-300">
            Acceso restringido. Esta ventana solo esta disponible para rol ADMIN_BAR.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`min-h-full overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.12), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Game Master Controls
          </h2>
          <p className="text-[11px] text-stone-500">Panel de control del mercado del reino</p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          ADMIN_BAR
        </div>
      </div>

      <div className="grid gap-3 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
          <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-200">
                  Global Market Actions
                </h3>
                <p className="text-[11px] text-stone-500">Crash, boom y reset de precios</p>
              </div>
              <span className="rounded border border-[#3b2a1f] bg-black/25 px-2 py-1 font-mono text-[10px] text-stone-500">
                {currentUser.role}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  runBackendAction({
                    type: "MARKET_CRASH",
                    description: "Simular Crash general",
                    action: simulateMarketCrash
                  })
                }
                className="rounded-md border border-red-700/60 bg-red-500/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simular Crash
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  runBackendAction({
                    type: "MARKET_BOOM",
                    description: "Simular Boom general",
                    action: simulateMarketBoom
                  })
                }
                className="rounded-md border border-emerald-700/60 bg-emerald-500/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simular Boom
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  runBackendAction({
                    type: "MARKET_RESET",
                    description: "Reset Market: precios reiniciados a basePrice",
                    action: resetMarket
                  })
                }
                className="rounded-md border border-amber-700/60 bg-amber-500/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset Market
              </button>
            </div>

            <div className={`mt-3 rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 font-mono text-[11px] ${statusClass(status.type)}`}>
              <div>{status.message}</div>
              {status.details && (
                <div className="mt-1 truncate text-[10px] text-amber-200/80" title={status.details}>
                  Tech: {status.details}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-200">
              Movimiento por activo
            </h3>
            <p className="mt-1 text-[11px] text-stone-500">
              Control real de precio por backend; volumen queda como evento local
            </p>

            <div className="mt-3 grid gap-3">
              <select
                value={activeProduct ? String(activeProduct.id) : ""}
                disabled={products.length === 0}
                onChange={(event) => {
                  const next = products.find((product) => String(product.id) === event.target.value);
                  if (next) onSelectProduct(next);
                }}
                className="w-full rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {products.length === 0 && <option value="">No assets</option>}
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>

              {activeProduct && (
                <div className="rounded-md border border-[#3b2a1f] bg-black/20 p-3 font-mono text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-stone-300">{activeProduct.name}</span>
                    <span className="text-stone-100">{money.format(activeProduct.currentPrice)}</span>
                  </div>
                  <div className="mt-1 text-stone-500">Base {money.format(activeProduct.basePrice)}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  Precio %
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percent}
                    onChange={(event) => setPercent(Math.max(1, Number(event.target.value) || 1))}
                    className="rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 font-mono text-sm text-stone-100 outline-none focus:border-amber-600"
                  />
                </label>
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  Volumen
                  <input
                    type="number"
                    min="0"
                    value={volume}
                    onChange={(event) => setVolume(Math.max(0, Number(event.target.value) || 0))}
                    className="rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 font-mono text-sm text-stone-100 outline-none focus:border-amber-600"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!activeProduct || isSubmitting}
                  onClick={() => {
                    const productId = toProductId(activeProduct);
                    if (!activeProduct || productId === null) return;
                    runBackendAction({
                      type: "PRODUCT_PRICE_UP",
                      description: `${activeProduct.name}: subir precio ${percent}%`,
                      action: () => increaseProductPrice(productId, percent)
                    });
                  }}
                  className="rounded-md border border-emerald-700/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Subir precio %
                </button>
                <button
                  type="button"
                  disabled={!activeProduct || isSubmitting}
                  onClick={() => {
                    const productId = toProductId(activeProduct);
                    if (!activeProduct || productId === null) return;
                    runBackendAction({
                      type: "PRODUCT_PRICE_DOWN",
                      description: `${activeProduct.name}: bajar precio ${percent}%`,
                      action: () => decreaseProductPrice(productId, percent)
                    });
                  }}
                  className="rounded-md border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bajar precio %
                </button>
                <button
                  type="button"
                  disabled={!activeProduct}
                  onClick={() => {
                    if (!activeProduct) return;
                    recordLocalEvent(
                      "VOLUME_CHANGE",
                      `${activeProduct.name}: cambiar volumen a ${volume}`,
                      "Evento local. El backend aun no expone volumen por activo."
                    );
                  }}
                  className="rounded-md border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cambiar volumen
                </button>
                <button
                  type="button"
                  disabled={!activeProduct || isSubmitting}
                  onClick={() => {
                    const productId = toProductId(activeProduct);
                    if (!activeProduct || productId === null) return;
                    runBackendAction({
                      type: "MARKET_RESET",
                      description: `${activeProduct.name}: resetear precio`,
                      action: () => resetProductPrice(productId)
                    });
                  }}
                  className="rounded-md border border-[#4a3323] bg-black/20 px-3 py-2 text-xs font-semibold text-stone-300 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Resetear precio
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-200">
                World News Engine
              </h3>
              <p className="text-[11px] text-stone-500">
                Publica noticias de reino que mueven precios y aparecen en Guild Herald
              </p>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={runRandomWorldNewsAction}
              className="rounded-md border border-amber-700/60 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Random News Event
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {worldEventButtons.map((event) => (
              <button
                key={event.type}
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  runWorldNewsAction({
                    type: event.type,
                    label: event.label,
                    action: () => triggerNewsEvent(event.type)
                  })
                }
                className="rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 text-xs font-semibold text-stone-200 transition hover:border-amber-700/60 hover:bg-amber-500/10 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-200">
                Market Events
              </h3>
              <p className="text-[11px] text-stone-500">Bitacora local de acciones del Game Master</p>
            </div>
            <button
              type="button"
              onClick={clearMarketEvents}
              disabled={marketEvents.length === 0}
              className="rounded border border-[#3b2a1f] bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-stone-500 transition hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#3b2a1f] text-left text-stone-500">
                  <th className="w-[13%] py-2 pr-2 font-medium">Time</th>
                  <th className="w-[15%] px-2 py-2 font-medium">Type</th>
                  <th className="w-[42%] px-2 py-2 font-medium">Description</th>
                  <th className="w-[17%] px-2 py-2 font-medium">User</th>
                  <th className="w-[13%] pl-2 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {marketEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-stone-500">
                      Aun no hay eventos de mercado en esta sesion.
                    </td>
                  </tr>
                )}
                {marketEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
