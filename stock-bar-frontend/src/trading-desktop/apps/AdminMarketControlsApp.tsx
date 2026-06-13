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
  if (type === "success") return "mes-positive";
  if (type === "error") return "mes-negative";
  return "mes-neutral";
}

function eventStatusClass(status: MarketEventStatus) {
  if (status === "SUCCESS") return "mes-positive";
  if (status === "FAILED") return "mes-negative";
  return "mes-warning";
}

function eventTypeClass(type: MarketEventType) {
  if (
    type === "MINING_ACCIDENT" ||
    type === "PORT_BLOCKADE" ||
    type === "BANKING_CRISIS" ||
    type === "PLAGUE_OUTBREAK"
  ) {
    return "mes-negative";
  }
  if (type === "ROYAL_CONTRACT" || type === "HARVEST_BOOM" || type === "MAGIC_DISCOVERY") {
    return "mes-positive";
  }
  if (type === "WAR_RUMORS") return "mes-warning";
  if (type === "MARKET_CRASH" || type === "PRODUCT_PRICE_DOWN" || type === "ORDER_SELL_FILLED") {
    return "mes-negative";
  }
  if (
    type === "MARKET_BOOM" ||
    type === "PRODUCT_PRICE_UP" ||
    type === "SALE_REGISTERED" ||
    type === "ORDER_BUY_FILLED"
  ) {
    return "mes-positive";
  }
  return "mes-warning";
}

function toProductId(product?: TradingInstrument) {
  if (!product) return null;
  const productId = Number(product.id);
  return Number.isFinite(productId) ? productId : null;
}

function EventRow({ event }: { event: MarketEvent }) {
  return (
    <tr>
      <td className="mes-neutral">{formatTime(event.timestamp)}</td>
      <td className={`font-semibold ${eventTypeClass(event.type)}`}>{event.type}</td>
      <td>
        <div className="truncate" title={event.description}>
          {event.description}
        </div>
        {event.details && (
          <div className="truncate text-[9px] mes-warning" title={event.details}>
            {event.details}
          </div>
        )}
      </td>
      <td className="mes-neutral">{event.user}</td>
      <td className={`text-right ${eventStatusClass(event.status)}`}>
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
      <section className="mes-app">
        <div className="mes-state min-h-[280px]">
        <div>
          <h2 className="mes-state__title">
            Game Master Controls
          </h2>
          <p className="mes-state__copy mes-negative">
            Unauthorized. This application requires the ADMIN_BAR role.
          </p>
        </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Game Master Controls
          </h2>
          <p className="mes-app__subtitle">Operational control of the kingdom market</p>
        </div>
        <div className="mes-code-badge">
          ADMIN_BAR
        </div>
      </div>

      <div className="mes-app__body">
        <div className="mes-admin-grid">
          <div className="mes-panel">
            <div className="mes-panel__header">
              <div>
                <h3 className="mes-panel__title">
                  Global Market Actions
                </h3>
                <p className="mes-app__subtitle">Crash, boom and reset the real market</p>
              </div>
              <span className="mes-tag">
                {currentUser.role}
              </span>
            </div>

            <div className="mes-action-grid">
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
                className="mes-button mes-button--danger"
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
                className="mes-button mes-button--positive"
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
                className="mes-button"
              >
                Reset Market
              </button>
            </div>

            <div className={`mes-statusline mt-3 ${statusClass(status.type)}`} aria-live="polite">
              <div>{status.message}</div>
              {status.details && (
                <div className="mt-1 truncate text-[10px] text-amber-200/80" title={status.details}>
                  Tech: {status.details}
                </div>
              )}
            </div>
          </div>

          <div className="mes-panel">
            <h3 className="mes-panel__title">
              Asset Controls
            </h3>
            <p className="mes-app__subtitle">
              Price controls are real; volume remains an explicit local event
            </p>

            <div className="mt-3 grid gap-3">
              <select
                value={activeProduct ? String(activeProduct.id) : ""}
                disabled={products.length === 0}
                onChange={(event) => {
                  const next = products.find((product) => String(product.id) === event.target.value);
                  if (next) onSelectProduct(next);
                }}
                className="mes-select"
              >
                {products.length === 0 && <option value="">No assets</option>}
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>

              {activeProduct && (
                <div className="mes-ticket-price">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{activeProduct.name}</span>
                    <span className="mes-warning">{money.format(activeProduct.currentPrice)}</span>
                  </div>
                  <div className="mes-ticket-price__base">Base {money.format(activeProduct.basePrice)}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="mes-field">
                  <span className="mes-field__label">
                  Precio %
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percent}
                    onChange={(event) => setPercent(Math.max(1, Number(event.target.value) || 1))}
                    className="mes-input"
                  />
                </label>
                <label className="mes-field">
                  <span className="mes-field__label">
                  Volumen
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={volume}
                    onChange={(event) => setVolume(Math.max(0, Number(event.target.value) || 0))}
                    className="mes-input"
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
                  className="mes-button mes-button--positive"
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
                  className="mes-button mes-button--danger"
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
                  className="mes-button"
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
                  className="mes-button"
                >
                  Resetear precio
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mes-panel">
          <div className="mes-panel__header">
            <div>
              <h3 className="mes-panel__title">
                World News Engine
              </h3>
              <p className="mes-app__subtitle">
                Publish real kingdom events that move prices and reach Guild Herald
              </p>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={runRandomWorldNewsAction}
              className="mes-button"
            >
              Generate Random News Event
            </button>
          </div>

          <div className="mes-action-grid">
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
                className="mes-button"
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mes-panel">
          <div className="mes-panel__header">
            <div>
              <h3 className="mes-panel__title">
                Market Events
              </h3>
              <p className="mes-app__subtitle">Technical ledger for Game Master actions</p>
            </div>
            <button
              type="button"
              onClick={clearMarketEvents}
              disabled={marketEvents.length === 0}
              className="mes-button mes-button--compact"
            >
              Clear
            </button>
          </div>

          <div className="mes-app-table-wrap">
            <table className="mes-table min-w-[720px] table-fixed">
              <thead>
                <tr>
                  <th className="w-[13%] text-left">Time</th>
                  <th className="w-[15%] text-left">Type</th>
                  <th className="w-[42%] text-left">Description</th>
                  <th className="w-[17%] text-left">User</th>
                  <th className="w-[13%] text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {marketEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center mes-neutral">
                      No market events have been recorded in this session.
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
