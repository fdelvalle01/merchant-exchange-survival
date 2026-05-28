import type { WorldEventType, WorldNewsItem } from "../types";
import { apiClient } from "./apiClient";

export async function getNews(limit = 100): Promise<WorldNewsItem[]> {
  const response = await apiClient.get<WorldNewsItem[]>("/api/news", {
    params: { limit }
  });

  return response.data;
}

export async function getLatestNews(limit = 10): Promise<WorldNewsItem[]> {
  const response = await apiClient.get<WorldNewsItem[]>("/api/news/latest", {
    params: { limit }
  });

  return response.data;
}

export async function generateRandomNewsEvent(): Promise<WorldNewsItem> {
  const response = await apiClient.post<WorldNewsItem>("/api/admin/events/random");
  return response.data;
}

export async function triggerNewsEvent(type: WorldEventType): Promise<WorldNewsItem> {
  const response = await apiClient.post<WorldNewsItem>(`/api/admin/events/${type}`);
  return response.data;
}
