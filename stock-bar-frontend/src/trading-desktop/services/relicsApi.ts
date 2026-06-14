import { apiClient } from "./apiClient";

export type AuctionStatus = "AVAILABLE" | "ENTERED" | "RESOLVED" | "EXPIRED" | "DECLINED";

export type AuctionCardResponse = {
  position: number;
  revealed: boolean;
  selected: boolean;
};

export type SealedAuctionResponse = {
  id: number;
  title: string;
  entryCost: number;
  availableFromDay: number;
  closesAtDay: number;
  daysRemaining: number;
  status: AuctionStatus;
  selectedCardPosition?: number | null;
  selectedRelic?: RelicResponse | null;
  cards: AuctionCardResponse[];
};

export type CompanyRelicStatus =
  | "IN_INVENTORY"
  | "EQUIPPED"
  | "ACTIVE"
  | "CONSUMED"
  | "EXPIRED";

export type RelicResponse = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: "PASSIVE" | "CONSUMABLE" | "TARGETED";
  targetType: "NONE" | "COMPANY" | "PRODUCT";
  activationType: "MANUAL";
  durationDays?: number | null;
  chargesRemaining?: number | null;
  effectType: string;
  iconKey: string;
  status: CompanyRelicStatus;
  acquiredAtDay: number;
  equippedSlot?: number | null;
  activatedAtDay?: number | null;
  expiresAtDay?: number | null;
  daysRemaining?: number | null;
  targetProductId?: number | null;
  sourceAuctionId?: number | null;
};

export type AuctionSelectionResponse = {
  auctionId: number;
  status: AuctionStatus;
  selectedCardPosition: number;
  relic: RelicResponse;
  cash: number;
};

export type ForecastDayResponse = {
  dayOffset: number;
  outlook: "BULLISH" | "BEARISH" | "VOLATILE" | "STABLE" | "UNKNOWN";
};

export type RelicActivationResponse = {
  relic: RelicResponse;
  cash: number;
  targetProductId?: number | null;
  targetProductName?: string | null;
  forecast?: ForecastDayResponse[] | null;
  confidence?: "LOW" | "MEDIUM" | "HIGH" | null;
};

export async function getActiveAuction() {
  const response = await apiClient.get<SealedAuctionResponse | null>("/api/game/auctions/active");
  return response.data;
}

export async function getAuction(id: number) {
  const response = await apiClient.get<SealedAuctionResponse>(`/api/game/auctions/${id}`);
  return response.data;
}

export async function selectAuctionCard(id: number, cardPosition: number) {
  const response = await apiClient.post<AuctionSelectionResponse>(
    `/api/game/auctions/${id}/select`,
    { cardPosition }
  );
  return response.data;
}

export async function getRelics() {
  const response = await apiClient.get<RelicResponse[]>("/api/game/relics");
  return response.data;
}

export async function equipRelic(id: number, slot: number) {
  const response = await apiClient.post<RelicResponse>(`/api/game/relics/${id}/equip`, { slot });
  return response.data;
}

export async function unequipRelic(id: number) {
  const response = await apiClient.post<RelicResponse>(`/api/game/relics/${id}/unequip`);
  return response.data;
}

export async function activateRelic(id: number, targetProductId?: number) {
  const response = await apiClient.post<RelicActivationResponse>(
    `/api/game/relics/${id}/activate`,
    targetProductId ? { targetProductId } : {}
  );
  return response.data;
}

export async function spawnSealedAuction() {
  const response = await apiClient.post<SealedAuctionResponse>("/api/admin/sealed-auctions/spawn");
  return response.data;
}

export async function expireSealedAuction() {
  const response = await apiClient.post<SealedAuctionResponse>("/api/admin/sealed-auctions/expire");
  return response.data;
}

export async function grantTestRelic(code: string) {
  const response = await apiClient.post<RelicResponse>(`/api/admin/relics/grant/${code}`);
  return response.data;
}
