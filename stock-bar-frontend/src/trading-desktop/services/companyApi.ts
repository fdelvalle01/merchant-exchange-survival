import { apiClient } from "./apiClient";

export type PlayerCompanyStatus = "ACTIVE" | "BANKRUPT" | "VICTORIOUS";

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
  gameDay?: number;
  status?: PlayerCompanyStatus | string;
  dailyBurnRate?: number;
  cashRunwayDays?: number;
  criticalDays?: number;
  victoryTarget?: number;
  bankruptcyReason?: string | null;
  buyBlockedUntilDay?: number | null;
  victoryMessage?: string | null;
  lastDayProcessedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getMyCompany(): Promise<PlayerCompanyResponse> {
  const response = await apiClient.get<PlayerCompanyResponse>("/api/company/me");
  return response.data;
}
