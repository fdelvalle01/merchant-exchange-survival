import { apiClient } from "./apiClient";

export type OrderSide = "BUY" | "SELL";

export type OrderStatus = "FILLED" | "REJECTED";

export type OrderResponse = {
  id: number;
  assetId: number;
  assetName: string;
  side: OrderSide;
  quantity: number;
  executedPrice: number;
  totalAmount: number;
  realizedPnl: number;
  status: OrderStatus;
  companyCash?: number;
  timestamp: string;
};

export async function createOrder(
  assetId: number,
  side: OrderSide,
  quantity: number
): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>("/api/orders", {
    assetId,
    side,
    quantity
  });

  return response.data;
}

export async function getOrders(): Promise<OrderResponse[]> {
  const response = await apiClient.get<OrderResponse[]>("/api/orders");
  return response.data;
}
