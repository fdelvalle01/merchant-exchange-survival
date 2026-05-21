export type DesktopAppId = "market" | "orders";

export type OrderSide = "BUY" | "SELL";

export type FeedMode = "products-api" | "offline";

export type Trend = "up" | "down" | "flat";

export type PricePoint = {
  timestamp: string;
  price: number;
};

export type TradingInstrument = {
  id: number | string;
  name: string;
  basePrice: number;
  currentPrice: number;
  enabled?: boolean;
  createdAt?: string;
  lastPurchasedAt?: string;
  priceChange?: number;
  percentageChange?: number;
  trend?: Trend | string;
  imageUrl?: string;
  maxPrice?: number;
  percentageDropFromMax?: number;
  history?: PricePoint[];
};
