import { normalizeInstrument } from "../marketUtils";
import type { TradingInstrument } from "../types";
import { apiClient } from "./apiClient";

export type ProductResponse = {
  id: number;
  name: string;
  basePrice: number;
  currentPrice: number;
  imageUrl?: string;
  sector?: string;
  enabled?: boolean;
  createdAt?: string;
  lastPurchasedAt?: string;
  maxPrice?: number;
};

export type ProductDetailedResponse = ProductResponse & {
  priceChange?: number;
  percentageChange?: number;
  percentageDropFromMax?: number;
  trend?: string;
};

export type ProductBoardResponse = ProductDetailedResponse & {
  history?: Array<Record<string, unknown>>;
};

function normalizeHistory(history?: Array<Record<string, unknown>>): TradingInstrument["history"] {
  if (!history) return undefined;

  return history
    .map((point) => ({
      timestamp: String(point.timestamp ?? ""),
      price: Number(point.price ?? 0)
    }))
    .filter((point) => point.timestamp.length > 0 && Number.isFinite(point.price));
}

export async function getProducts(): Promise<TradingInstrument[]> {
  const response = await apiClient.get<ProductResponse[]>("/api/products");
  return response.data.map(normalizeInstrument);
}

export async function getDetailedProducts(): Promise<TradingInstrument[]> {
  const response = await apiClient.get<ProductDetailedResponse[]>("/api/products/detailed");
  return response.data.map(normalizeInstrument);
}

export async function getProductBoard(): Promise<TradingInstrument[]> {
  const response = await apiClient.get<ProductBoardResponse[]>("/api/products/board");
  return response.data.map((product, index) =>
    normalizeInstrument(
      {
        ...product,
        history: normalizeHistory(product.history)
      },
      index
    )
  );
}
