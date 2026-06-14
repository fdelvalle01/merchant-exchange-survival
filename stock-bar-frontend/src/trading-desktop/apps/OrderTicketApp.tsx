import { FormEvent, useEffect, useMemo, useState } from "react";
import { money, percentFor, valueClass } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import { createOrder } from "../services/ordersApi";
import type { DesktopAppRenderProps, OrderSide, TradingInstrument } from "../types";
import { AssetIcon } from "../visualCatalog";

type OrderStatus = {
  type: "info" | "success" | "error";
  message: string;
  details?: string;
};

function toBackendProductId(id: TradingInstrument["id"]) {
  const productId = Number(id);
  return Number.isFinite(productId) ? productId : null;
}

function statusClass(type: OrderStatus["type"]) {
  if (type === "success") return "mes-positive";
  if (type === "error") return "mes-negative";
  return "mes-neutral";
}

export default function OrderTicketApp({
  currentUser,
  company,
  products,
  selectedProduct,
  onSelectProduct,
  onOrderCreated,
  addRejectedOrder,
  onOpenApp,
  isActive
}: DesktopAppRenderProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<OrderStatus>({
    type: "info",
    message: "Ready to invest"
  });
  const [side, setSide] = useState<OrderSide>("BUY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setStatus({
        type: "info",
        message: `Selected ${selectedProduct.name}`
      });
    }
  }, [selectedProduct?.id, selectedProduct?.name]);

  const selectedPercent = useMemo(
    () => (selectedProduct ? percentFor(selectedProduct) : 0),
    [selectedProduct]
  );
  const hasOrderAccess = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");
  const companyStatus = company?.status ?? "ACTIVE";
  const canTradeCompany = companyStatus === "ACTIVE";
  const isAssetEnabled = selectedProduct?.enabled !== false;
  const canSendOrders = hasOrderAccess && canTradeCompany && isAssetEnabled;
  const isBuyBlocked =
    company?.buyBlockedUntilDay != null &&
    company?.gameDay != null &&
    company.gameDay < company.buyBlockedUntilDay;
  const canSendSelectedSide = canSendOrders && !(side === "BUY" && isBuyBlocked);
  const normalizedQuantity = Math.max(1, Number(quantity) || 1);
  const estimatedTotal = selectedProduct ? selectedProduct.currentPrice * normalizedQuantity : 0;
  const tradingDisabledMessage =
    companyStatus === "BANKRUPT"
      ? "Trading disabled: company is BANKRUPT."
      : companyStatus === "VICTORIOUS"
      ? "Trading disabled: victory achieved."
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasOrderAccess) {
      setStatus({
        type: "error",
        message: "Access denied. Tu rol no permite enviar ordenes."
      });
      return;
    }

    if (!canTradeCompany) {
      setStatus({
        type: "error",
        message: tradingDisabledMessage ?? `Trading disabled: company is ${companyStatus}.`
      });
      return;
    }

    if (!selectedProduct) {
      setStatus({
        type: "error",
        message: "Select an asset first."
      });
      return;
    }
    if (side === "BUY" && isBuyBlocked) {
      setStatus({
        type: "error",
        message: "Buy orders are blocked until next day."
      });
      return;
    }

    const productId = toBackendProductId(selectedProduct.id);
    if (productId === null) {
      setStatus({
        type: "error",
        message: "Activo sin id valido para backend."
      });
      return;
    }

    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    const orderDraft = {
      productId,
      productName: selectedProduct.name,
      side,
      quantity: normalizedQuantity,
      price: selectedProduct.currentPrice
    };

    setIsSubmitting(true);
    setStatus({
      type: "info",
      message: `Enviando ${side.toLowerCase()}...`
    });

    try {
      const response = await createOrder(productId, side, normalizedQuantity);
      setStatus({
        type: "success",
        message: `${response.side} filled: ${normalizedQuantity} x ${selectedProduct.name}`
      });
      await onOrderCreated();
      onOpenApp("orders");
    } catch (error) {
      console.error("Order ticket submit failed", error);
      const apiError = normalizeApiError(error);
      const isInsufficientFunds =
        apiError.status === 409 && apiError.message.toLowerCase().includes("insufficient funds");
      const isInsufficientHoldings =
        side === "SELL" &&
        apiError.status === 409 &&
        (apiError.message.toLowerCase().includes("holding") ||
          apiError.message.toLowerCase().includes("sell"));
      const userMessage = isInsufficientFunds
        ? "Insufficient funds. Tu compania no tiene cash suficiente."
        : isInsufficientHoldings
        ? "Not enough holdings to sell this asset."
        : apiError.message;
      addRejectedOrder({
        ...orderDraft,
        errorMessage: userMessage,
        errorStatus: apiError.status,
        errorDetails: apiError.details
      });
      setStatus({
        type: "error",
        message: userMessage,
        details: apiError.details
      });
      onOpenApp("orders");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Royal Ticket
          </h2>
          <p className="mes-app__subtitle">Real BUY / SELL orders through /api/orders</p>
        </div>
        <div className="mes-code-badge">
          OT-01
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mes-app__body">
        <div className="mes-field">
          <label className="mes-field__label">
            Asset under seal
          </label>
          <select
            value={selectedProduct ? String(selectedProduct.id) : ""}
            disabled={products.length === 0}
            onChange={(event) => {
              const next = products.find(
                (product) => String(product.id) === event.target.value
              );
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
        </div>

        <div className="mes-segmented">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            disabled={isSubmitting || !canTradeCompany || isBuyBlocked}
            className={`mes-segment ${side === "BUY" ? "is-buy" : ""}`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            disabled={isSubmitting || !canTradeCompany}
            className={`mes-segment ${side === "SELL" ? "is-sell" : ""}`}
          >
            SELL
          </button>
        </div>

        {!hasOrderAccess && (
          <div className="mes-banner mes-banner--danger">
            Access denied. VIEWER may inspect the market but cannot send orders.
          </div>
        )}
        {tradingDisabledMessage && (
          <div className="mes-banner mes-banner--danger">
            {tradingDisabledMessage}
          </div>
        )}
        {isBuyBlocked && (
          <div className="mes-banner mes-banner--warning">
            Buy orders are blocked until next day. SELL remains available.
          </div>
        )}
        {!isAssetEnabled && (
          <div className="mes-banner mes-banner--warning">
            This asset is disabled by the exchange and cannot be traded.
          </div>
        )}

        <div className="mes-field">
            <label className="mes-field__label">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              disabled={!selectedProduct || isSubmitting || !canSendSelectedSide}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="mes-input"
            />
        </div>

        <div className="mes-ticket-price">
          <AssetIcon
            name={selectedProduct?.name}
            sector={selectedProduct?.sector}
            className="mes-asset-icon--ticket"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="mes-plate__label">Current exchange price</span>
            <span className={valueClass(selectedPercent)}>
              {selectedPercent > 0 ? "+" : ""}
              {selectedPercent.toFixed(2)}%
            </span>
          </div>
              <div className="mes-ticket-price__value">
                {selectedProduct ? money.format(selectedProduct.currentPrice) : money.format(0)}
              </div>
              <div className="mes-ticket-price__base">
                Base {selectedProduct ? money.format(selectedProduct.basePrice) : money.format(0)}
              </div>
          </div>
        </div>

        <div className="mes-plate">
          <div className="mes-plate__label">Estimated total</div>
          <div className="mes-plate__value mes-warning">{money.format(estimatedTotal)}</div>
        </div>

        <div className="mes-banner mes-banner--info">
          The exchange engine sets the execution price. The frontend never sends a price.
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedProduct || !canSendSelectedSide}
          className={`mes-button mes-button--full ${
            side === "SELL" ? "mes-button--danger" : "mes-button--primary"
          }`}
        >
          {isSubmitting ? "Sending..." : `Send ${side} Order`}
        </button>

        <div className={`mes-statusline ${statusClass(status.type)}`} aria-live="polite">
          <div>{status.message}</div>
          {status.details && (
            <div className="mt-1 truncate text-[10px] text-amber-200/80" title={status.details}>
              Tech: {status.details}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
