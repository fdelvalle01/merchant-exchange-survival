import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productsApi";
import type { FeedMode, TradingInstrument } from "../types";

type ProductsFeedState = {
  products: TradingInstrument[];
  isLoading: boolean;
  error: string | null;
  feedMode: FeedMode;
  refreshProducts: () => Promise<void>;
};

export function useProductsFeed(refreshRateMillis = 5000): ProductsFeedState {
  const [products, setProducts] = useState<TradingInstrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>("offline");

  const refreshProducts = useCallback(async () => {
    try {
      const nextProducts = await getProducts();
      setProducts(nextProducts);
      setError(null);
      setFeedMode("products-api");
    } catch (loadError) {
      console.error("Could not load products feed", loadError);
      setError("Backend offline. Esperando activos desde /api/products...");
      setFeedMode("offline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();

    const interval = window.setInterval(refreshProducts, refreshRateMillis);
    return () => window.clearInterval(interval);
  }, [refreshProducts, refreshRateMillis]);

  return {
    products,
    isLoading,
    error,
    feedMode,
    refreshProducts
  };
}
