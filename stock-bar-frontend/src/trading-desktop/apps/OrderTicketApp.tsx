import { FormEvent, useEffect, useMemo, useState } from "react";
import { money, percentFor, valueClass } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import { createOrder } from "../services/ordersApi";
import type { DesktopAppRenderProps, OrderSide, TradingInstrument } from "../types";

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
  if (type === "success") return "text-emerald-300";
  if (type === "error") return "text-red-300";
  return "text-stone-400";
}

export default function OrderTicketApp({
  currentUser,
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
  const canSendOrders = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSendOrders) {
      setStatus({
        type: "error",
        message: "Access denied. Tu rol no permite enviar ordenes."
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
    <section
      className={`overflow-hidden rounded-md border bg-[#100b08]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(160deg, rgba(188, 129, 60, 0.10), transparent 42%), repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 16px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Investment Ticket
          </h2>
          <p className="text-[11px] text-stone-500">Ordenes contra /api/orders</p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          OT-01
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 p-4 text-sm">
        <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-stone-500">
            Asset
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
            className="w-full rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 text-stone-100 outline-none focus:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {products.length === 0 && <option value="">No assets</option>}
            {products.map((product) => (
              <option key={product.id} value={String(product.id)}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            disabled={isSubmitting}
            className={`rounded-md border px-3 py-2 text-center font-semibold transition ${
              side === "BUY"
                ? "border-emerald-400 bg-emerald-400/15 text-emerald-200"
                : "border-[#3b2a1f] bg-black/25 text-stone-500 hover:text-stone-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            disabled={isSubmitting}
            className={`rounded-md border px-3 py-2 text-center font-semibold transition ${
              side === "SELL"
                ? "border-red-400 bg-red-400/15 text-red-200"
                : "border-[#3b2a1f] bg-black/25 text-stone-500 hover:text-stone-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            SELL
          </button>
        </div>

        {!canSendOrders && (
          <div className="rounded-md border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            Access denied. VIEWER puede mirar el mercado, pero no enviar ordenes.
          </div>
        )}

        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-stone-500">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              disabled={!selectedProduct || isSubmitting || !canSendOrders}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-full rounded-md border border-[#4a3323] bg-[#090604] px-3 py-2 font-mono text-stone-100 outline-none focus:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Precio actual backend</span>
            <span className={valueClass(selectedPercent)}>
              {selectedPercent > 0 ? "+" : ""}
              {selectedPercent.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            {selectedProduct?.imageUrl && (
              <img
                src={selectedProduct.imageUrl}
                alt=""
                className="h-12 w-12 rounded border border-[#4a3323] object-cover"
              />
            )}
            <div>
              <div className="font-mono text-xl text-stone-100">
                {selectedProduct ? money.format(selectedProduct.currentPrice) : money.format(0)}
              </div>
              <div className="text-xs text-stone-500">
                Base {selectedProduct ? money.format(selectedProduct.basePrice) : money.format(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/20 px-3 py-2 text-xs text-stone-500">
          El precio no se envia al backend. El motor define el precio actual.
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedProduct || !canSendOrders}
          className={`rounded-md border px-3 py-3 font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
            side === "SELL"
              ? "border-red-500/70 bg-red-500/15 text-red-100 hover:bg-red-500/25"
              : "border-amber-600/70 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
          }`}
        >
          {isSubmitting ? "Enviando..." : `ENVIAR ${side}`}
        </button>

        <div className={`min-h-8 rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 font-mono text-[11px] ${statusClass(status.type)}`}>
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
