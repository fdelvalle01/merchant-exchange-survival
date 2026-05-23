import { apiClient } from "./apiClient";

export async function simulateMarketCrash() {
  const response = await apiClient.post<string>("/api/admin/market/crash");
  return response.data;
}

export async function simulateMarketBoom() {
  const response = await apiClient.post<string>("/api/admin/market/boom");
  return response.data;
}

export async function resetMarket() {
  const response = await apiClient.post<string>("/api/admin/market/reset");
  return response.data;
}

export async function increaseProductPrice(productId: number, percent: number) {
  const response = await apiClient.post<string>(`/api/admin/products/${productId}/price/up`, {
    percent
  });
  return response.data;
}

export async function decreaseProductPrice(productId: number, percent: number) {
  const response = await apiClient.post<string>(`/api/admin/products/${productId}/price/down`, {
    percent
  });
  return response.data;
}

export async function resetProductPrice(productId: number) {
  const response = await apiClient.post<string>(`/api/admin/products/${productId}/reset`);
  return response.data;
}
