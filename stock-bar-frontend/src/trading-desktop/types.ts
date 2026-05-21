export type DesktopAppId = "market" | "ticket";

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

export type DesktopWindow = {
  id: string;
  appId: DesktopAppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
};

export type DesktopAppRenderProps = {
  products: TradingInstrument[];
  selectedProduct?: TradingInstrument;
  onSelectProduct: (product: TradingInstrument) => void;
  onOrderCreated: () => void | Promise<void>;
  isActive: boolean;
  isLoadingProducts: boolean;
  productsError: string | null;
  onRetryProducts: () => void;
  onOpenApp: (appId: DesktopAppId) => void;
};
