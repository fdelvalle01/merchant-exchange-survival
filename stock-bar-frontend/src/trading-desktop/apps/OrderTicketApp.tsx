import { FormEvent, useEffect, useMemo, useState } from "react";
import { money, percentFor, valueClass } from "../marketUtils";
import { createSale } from "../services/salesApi";
import type { DesktopAppRenderProps, TradingInstrument } from "../types";

type OrderStatus = {
  type: "info" | "success" | "error";
  message: string;
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
  products,
  selectedProduct,
  onSelectProduct,
  onOrderCreated,
  isActive
}: DesktopAppRenderProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<OrderStatus>({
    type: "info",
    message: "Ready to buy"
  });
  const [isBuying, setIsBuying] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      setStatus({
        type: "error",
        message: "Select an instrument first."
      });
      return;
    }

    const productId = toBackendProductId(selectedProduct.id);
    if (productId === null) {
      setStatus({
        type: "error",
        message: "Producto sin id valido para backend."
      });
      return;
    }

    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    setIsBuying(true);
    setStatus({
      type: "info",
      message: "Enviando compra..."
    });

    try {
      await createSale(productId, normalizedQuantity);
      setStatus({
        type: "success",
        message: `Compra enviada: ${normalizedQuantity} x ${selectedProduct.name}`
      });
      await onOrderCreated();
    } catch (error) {
      console.error("Order ticket submit failed", error);
      setStatus({
        type: "error",
        message: "No se pudo registrar la compra en backend."
      });
    } finally {
      setIsBuying(false);
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
            Order Ticket
          </h2>
          <p className="text-[11px] text-stone-500">Compra real contra /api/sales</p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          OT-01
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 p-4 text-sm">
        <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-stone-500">
            Product
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
            {products.length === 0 && <option value="">No products</option>}
            {products.map((product) => (
              <option key={product.id} value={String(product.id)}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-emerald-400 bg-emerald-400/15 px-3 py-2 text-center font-semibold text-emerald-200">
            BUY
          </div>
          <div
            className="rounded-md border border-[#3b2a1f] bg-black/25 px-3 py-2 text-center font-semibold text-stone-600"
            title="El backend actual solo permite comprar"
          >
            SELL
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-stone-500">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              disabled={!selectedProduct || isBuying}
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
          El precio no se envia en la orden. El motor del backend define el precio actual y sus
          variaciones.
        </div>

        <button
          type="submit"
          disabled={isBuying || !selectedProduct}
          className="rounded-md border border-amber-600/70 bg-amber-500/15 px-3 py-3 font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBuying ? "Enviando..." : "Comprar"}
        </button>

        <div className={`min-h-8 rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 font-mono text-[11px] ${statusClass(status.type)}`}>
          {status.message}
        </div>
      </form>
    </section>
  );
}
