import { apiClient } from "./apiClient";

export type SaleResponse = {
  id: number;
  quantity: number;
  timestamp: string;
};

export async function createSale(productId: number, quantity: number): Promise<SaleResponse> {
  const response = await apiClient.post<SaleResponse>("/api/sales", {
    productId,
    quantity
  });

  return response.data;
}
