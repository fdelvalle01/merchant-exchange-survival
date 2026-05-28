import { apiClient } from "./apiClient";

export type PlayerCompanyResponse = {
  id: number;
  username: string;
  companyName: string;
  cash: number;
  debt: number;
  companyValue: number;
  realizedPnl: number;
  portfolioValue?: number;
  reputation: number;
  riskLevel: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getMyCompany(): Promise<PlayerCompanyResponse> {
  const response = await apiClient.get<PlayerCompanyResponse>("/api/company/me");
  return response.data;
}
