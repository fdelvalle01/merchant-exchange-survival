import { apiClient } from "./apiClient";

export type PortfolioHoldingResponse = {
  assetId: number;
  assetName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  createdAt?: string;
  updatedAt?: string;
};

export async function getPortfolio(): Promise<PortfolioHoldingResponse[]> {
  const response = await apiClient.get<PortfolioHoldingResponse[]>("/api/portfolio");
  return response.data;
}
