import { useCallback, useRef, useState } from "react";
import type { LocalOrder, LocalOrderDraft, LocalOrderStatus } from "../types";

function formatOrderId(nextValue: number) {
  return `ORD-${String(nextValue).padStart(6, "0")}`;
}

export function useLocalOrders() {
  const orderSequence = useRef(1);
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  const addOrder = useCallback((orderData: LocalOrderDraft, status: LocalOrderStatus) => {
    const nextOrder: LocalOrder = {
      id: formatOrderId(orderSequence.current),
      timestamp: new Date().toISOString(),
      productId: orderData.productId,
      productName: orderData.productName,
      side: orderData.side,
      quantity: orderData.quantity,
      price: orderData.price,
      status,
      errorMessage: orderData.errorMessage,
      errorStatus: orderData.errorStatus,
      errorDetails: orderData.errorDetails,
      source: "LOCAL"
    };

    orderSequence.current += 1;
    setOrders((currentOrders) => [nextOrder, ...currentOrders]);
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
    setOrders([]);
    orderSequence.current = 1;
  }, []);

  return {
    orders,
    addFilledOrder,
    addRejectedOrder,
    clearOrders
  };
}
