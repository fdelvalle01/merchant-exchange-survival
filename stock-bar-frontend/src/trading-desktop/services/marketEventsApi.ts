import type { MarketEvent, MarketEventType } from "../types";
import { apiClient } from "./apiClient";

type MarketEventResponse = {
  id: number;
  type: string;
  description: string;
  executedBy: string;
  timestamp: string;
};

export async function getMarketEvents(limit = 100): Promise<MarketEvent[]> {
  const response = await apiClient.get<MarketEventResponse[]>("/api/market-events", {
    params: { limit }
  });

  return response.data.map((event) => ({
    id: String(event.id),
    timestamp: event.timestamp,
    type: event.type as MarketEventType,
    description: event.description,
    user: event.executedBy,
    status: "SUCCESS",
    source: "BACKEND"
  }));
}
