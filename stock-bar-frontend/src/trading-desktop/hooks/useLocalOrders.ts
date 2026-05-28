import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOrders, type OrderResponse } from "../services/ordersApi";
import type { LocalOrder, LocalOrderDraft, LocalOrderStatus } from "../types";

function formatOrderId(nextValue: number) {
  return `ORD-${String(nextValue).padStart(6, "0")}`;
}

function mapBackendOrder(order: OrderResponse): LocalOrder {
  return {
    id: `ORD-${String(order.id).padStart(6, "0")}`,
    timestamp: order.timestamp,
    productId: order.assetId,
    productName: order.assetName,
    side: order.side,
    quantity: order.quantity,
    price: Number(order.executedPrice ?? 0),
    totalAmount: Number(order.totalAmount ?? 0),
    realizedPnl: Number(order.realizedPnl ?? 0),
    status: order.status,
    source: "BACKEND"
  };
}

export function useLocalOrders(enabled = true) {
  const orderSequence = useRef(1);
  const [backendOrders, setBackendOrders] = useState<LocalOrder[]>([]);
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    if (!enabled) {
      setBackendOrders([]);
      setOrdersError(null);
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);
    try {
      const nextOrders = await getOrders();
      setBackendOrders(nextOrders.map(mapBackendOrder));
      setOrdersError(null);
    } catch (error) {
      console.error("Could not load orders", error);
      setOrdersError("No se pudo cargar el historial de ordenes.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [enabled]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const orders = useMemo(
    () =>
      [...localOrders, ...backendOrders].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [backendOrders, localOrders]
  );

  const addOrder = useCallback((orderData: LocalOrderDraft, status: LocalOrderStatus) => {
    const nextOrder: LocalOrder = {
      id: formatOrderId(orderSequence.current),
      timestamp: new Date().toISOString(),
      productId: orderData.productId,
      productName: orderData.productName,
      side: orderData.side,
      quantity: orderData.quantity,
      price: orderData.price,
      totalAmount: orderData.price * orderData.quantity,
      status,
      errorMessage: orderData.errorMessage,
      errorStatus: orderData.errorStatus,
      errorDetails: orderData.errorDetails,
      source: "LOCAL"
    };

    orderSequence.current += 1;
    setLocalOrders((currentOrders) => [nextOrder, ...currentOrders]);
    return nextOrder;
  }, []);

  const addFilledOrder = useCallback(
    (orderData: LocalOrderDraft) => addOrder(orderData, "FILLED"),
    [addOrder]
  );

  const addRejectedOrder = useCallback(
    (orderData: LocalOrderDraft) => addOrder(orderData, "REJECTED"),
    [addOrder]
  );

  const clearOrders = useCallback(() => {
    setLocalOrders([]);
    orderSequence.current = 1;
  }, []);

  return {
    orders,
    isLoadingOrders,
    ordersError,
    refreshOrders,
    addFilledOrder,
    addRejectedOrder,
    clearOrders
  };
}
