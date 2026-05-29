import { apiClient } from "./apiClient";
import type { PlayerCompanyResponse } from "./companyApi";

export type GameStateResponse = Omit<PlayerCompanyResponse, "id"> & {
  companyId: number;
  unrealizedPnl?: number;
  victoryMessage?: string | null;
};

export async function getGameState(): Promise<GameStateResponse> {
  const response = await apiClient.get<GameStateResponse>("/api/game/state");
  return response.data;
}

export async function endDay(): Promise<GameStateResponse> {
  const response = await apiClient.post<GameStateResponse>("/api/game/end-day");
  return response.data;
}
