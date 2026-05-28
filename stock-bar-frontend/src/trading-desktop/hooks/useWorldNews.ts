import { useCallback, useEffect, useRef, useState } from "react";
import { getNews } from "../services/newsApi";
import type { WorldNewsItem } from "../types";

type WorldNewsState = {
  worldNews: WorldNewsItem[];
  isLoadingNews: boolean;
  newsError: string | null;
  refreshNews: () => Promise<void>;
};

export function useWorldNews(
  onNewItems?: (items: WorldNewsItem[]) => void,
  refreshRateMillis = 10000
): WorldNewsState {
  const [worldNews, setWorldNews] = useState<WorldNewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const hasLoadedOnce = useRef(false);

  const refreshNews = useCallback(async () => {
    try {
      const nextNews = await getNews(100);
      const newItems = nextNews.filter((item) => !seenIds.current.has(item.id));
      nextNews.forEach((item) => seenIds.current.add(item.id));

      setWorldNews(nextNews);
      setNewsError(null);

      if (hasLoadedOnce.current && newItems.length > 0) {
        onNewItems?.([...newItems].sort((a, b) => a.id - b.id));
      }

      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Could not load world news", error);
      setNewsError("No se pudo cargar Guild Herald.");
    } finally {
      setIsLoadingNews(false);
    }
  }, [onNewItems]);

  useEffect(() => {
    refreshNews();

    const interval = window.setInterval(refreshNews, refreshRateMillis);
    return () => window.clearInterval(interval);
  }, [refreshNews, refreshRateMillis]);

  return {
    worldNews,
    isLoadingNews,
    newsError,
    refreshNews
  };
}
