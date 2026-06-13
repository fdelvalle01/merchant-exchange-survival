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
  return side === "BUY" ? "mes-positive" : "mes-negative";
}

function statusClass(status: LocalOrderStatus) {
  if (status === "FILLED") return "mes-positive";
  if (status === "REJECTED") return "mes-negative";
  return "mes-warning";
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
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Trade Ledger
          </h2>
          <p className="mes-app__subtitle">Real order history from /api/orders</p>
        </div>
        <button
          type="button"
          onClick={onOrdersChanged}
          className="mes-icon-button"
          title="Refresh orders"
          aria-label="Refresh orders"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="mes-app__body">
        {isLoadingOrders && (
          <div className="mes-banner">
            Loading orders...
          </div>
        )}
        {ordersError && (
          <div className="mes-banner mes-banner--danger">
            {ordersError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mes-filter-group">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`mes-filter ${activeFilter === filter ? "is-active" : ""}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearOrders}
            disabled={!hasLocalOrders}
            className="mes-button mes-button--compact"
          >
            Clear Local
          </button>
        </div>

        <div className="mes-app-table-wrap">
          <table className="mes-table min-w-[880px] table-fixed">
            <thead>
              <tr>
                <th className="w-[14%] text-left">Order ID</th>
                <th className="w-[11%] text-left">Time</th>
                <th className="w-[23%] text-left">Asset</th>
                <th className="w-[8%] text-right">Side</th>
                <th className="w-[8%] text-right">Qty</th>
                <th className="w-[12%] text-right">Price</th>
                <th className="w-[12%] text-right">Total</th>
                <th className="w-[12%] text-right">Realized</th>
                <th className="w-[10%] text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {!isLoadingOrders && localOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center mes-neutral">
                    No orders have been recorded.
                  </td>
                </tr>
              )}

              {localOrders.length > 0 && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center mes-neutral">
                    No orders match the selected filter.
                  </td>
                </tr>
              )}

              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td className="mes-neutral">{formatTime(order.timestamp)}</td>
                  <td className="truncate">
                    {order.productName}
                    {order.status === "REJECTED" && (
                      <div className="mt-1 space-y-0.5 font-mono text-[10px]">
                        <div className="truncate mes-negative" title={formatRejectedMeta(order)}>
                          {formatRejectedMeta(order)}
                        </div>
                        {order.errorDetails && (
                          <div className="truncate mes-warning" title={order.errorDetails}>
                            {order.errorDetails}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`text-right ${sideClass(order.side)}`}>
                    {order.side}
                  </td>
                  <td className="text-right">{order.quantity}</td>
                  <td className="text-right">
                    {money.format(order.price)}
                  </td>
                  <td className="text-right">
                    {money.format(order.totalAmount ?? order.price * order.quantity)}
                  </td>
                  <td className={`text-right ${order.side === "SELL" ? valueClass(order.realizedPnl ?? 0) : "mes-neutral"}`}>
                    {order.side === "SELL" ? money.format(order.realizedPnl ?? 0) : "-"}
                  </td>
                  <td className={`text-right ${statusClass(order.status)}`}>
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
