import { apiClient } from "./apiClient";

export type PriceHistoryPoint = {
  timestamp: string;
  price: number;
};

type PriceHistoryPointResponse = {
  timestamp: string;
  price: number;
};

export async function getPriceHistory(
  productId: number | string,
  limit = 80
): Promise<PriceHistoryPoint[]> {
  const response = await apiClient.get<PriceHistoryPointResponse[]>("/api/price-history", {
    params: {
      productId,
      limit
    }
  });

  return response.data
    .map((point) => ({
      timestamp: point.timestamp,
      price: Number(point.price)
    }))
    .filter((point) => point.timestamp && Number.isFinite(point.price));
}
