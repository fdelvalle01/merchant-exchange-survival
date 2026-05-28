import { useMemo, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import type { DesktopAppRenderProps, LocalOrder, LocalOrderStatus, OrderSide } from "../types";

type OrderFilter = "ALL" | "BUY" | "SELL" | "FILLED" | "REJECTED";

const filters: OrderFilter[] = ["ALL", "BUY", "SELL", "FILLED", "REJECTED"];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatRejectedMeta(order: LocalOrder) {
  const parts = [];
  if (order.errorStatus) parts.push(`HTTP ${order.errorStatus}`);
  if (order.errorMessage) parts.push(order.errorMessage);
  parts.push(formatTime(order.timestamp));
  return parts.join(" | ");
}

function sideClass(side: OrderSide) {
  return side === "BUY" ? "text-emerald-300" : "text-red-300";
}

function statusClass(status: LocalOrderStatus) {
  if (status === "FILLED") return "text-emerald-300";
  if (status === "REJECTED") return "text-red-300";
  return "text-amber-300";
}

function matchesFilter(order: LocalOrder, filter: OrderFilter) {
  if (filter === "ALL") return true;
  if (filter === "BUY") return order.side === "BUY";
  if (filter === "SELL") return order.side === "SELL";
  return order.status === filter;
}

export default function MyOrdersApp({
  localOrders,
  clearOrders,
  isLoadingOrders,
  ordersError,
  onOrdersChanged,
  isActive
}: DesktopAppRenderProps) {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("ALL");
  const filteredOrders = useMemo(
    () => localOrders.filter((order) => matchesFilter(order, activeFilter)),
    [activeFilter, localOrders]
  );
  const hasLocalOrders = localOrders.some((order) => order.source === "LOCAL");

  return (
    <section
      className={`min-h-full overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.10), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Trade History
          </h2>
          <p className="text-[11px] text-stone-500">Historial remoto de /api/orders</p>
        </div>
        <button
          type="button"
          onClick={onOrdersChanged}
          className="grid h-7 w-7 place-items-center rounded border border-amber-700/40 bg-black/30 text-amber-300 transition hover:bg-amber-500/10"
          title="Refresh orders"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 p-3">
        {isLoadingOrders && (
          <div className="rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 text-xs text-stone-500">
            Loading orders...
          </div>
        )}
        {ordersError && (
          <div className="rounded border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {ordersError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeFilter === filter
                    ? "border-amber-600/70 bg-amber-500/15 text-amber-100"
                    : "border-[#3b2a1f] bg-black/20 text-stone-500 hover:text-stone-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearOrders}
            disabled={!hasLocalOrders}
            className="rounded border border-[#3b2a1f] bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-stone-500 transition hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Local
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-[#3b2a1f] text-left text-stone-500">
                <th className="w-[14%] py-2 pr-2 font-medium">Order ID</th>
                <th className="w-[11%] px-2 py-2 font-medium">Time</th>
                <th className="w-[23%] px-2 py-2 font-medium">Asset</th>
                <th className="w-[8%] px-2 py-2 text-right font-medium">Side</th>
                <th className="w-[8%] px-2 py-2 text-right font-medium">Qty</th>
                <th className="w-[12%] px-2 py-2 text-right font-medium">Price</th>
                <th className="w-[12%] px-2 py-2 text-right font-medium">Total</th>
                <th className="w-[12%] px-2 py-2 text-right font-medium">Realized</th>
                <th className="w-[10%] pl-2 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {!isLoadingOrders && localOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-stone-500">
                    Aun no hay ordenes.
                  </td>
                </tr>
              )}

              {localOrders.length > 0 && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-stone-500">
                    No hay ordenes para el filtro seleccionado.
                  </td>
                </tr>
              )}

              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[#241811] hover:bg-[#20160f]">
                  <td className="py-2.5 pr-2 text-stone-300">{order.id}</td>
                  <td className="px-2 py-2.5 text-stone-500">{formatTime(order.timestamp)}</td>
                  <td className="truncate px-2 py-2.5 font-sans text-sm text-stone-100">
                    {order.productName}
                    {order.status === "REJECTED" && (
                      <div className="mt-1 space-y-0.5 font-mono text-[10px]">
                        <div className="truncate text-red-300" title={formatRejectedMeta(order)}>
                          {formatRejectedMeta(order)}
                        </div>
                        {order.errorDetails && (
                          <div className="truncate text-amber-300/80" title={order.errorDetails}>
                            {order.errorDetails}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-2 py-2.5 text-right ${sideClass(order.side)}`}>
                    {order.side}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-300">{order.quantity}</td>
                  <td className="px-2 py-2.5 text-right text-stone-300">
                    {money.format(order.price)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-300">
                    {money.format(order.totalAmount ?? order.price * order.quantity)}
                  </td>
                  <td className={`px-2 py-2.5 text-right ${order.side === "SELL" ? valueClass(order.realizedPnl ?? 0) : "text-stone-600"}`}>
                    {order.side === "SELL" ? money.format(order.realizedPnl ?? 0) : "-"}
                  </td>
                  <td className={`pl-2 py-2.5 text-right ${statusClass(order.status)}`}>
                    {order.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
