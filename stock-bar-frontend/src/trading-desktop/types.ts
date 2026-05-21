export type DesktopAppId = "market" | "ticket" | "detail" | "orders";

export type FeedMode = "products-api" | "offline";

export type Trend = "up" | "down" | "flat";

export type OrderSide = "BUY" | "SELL";

export type LocalOrderStatus = "FILLED" | "REJECTED" | "PENDING";

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
  localOrders: LocalOrder[];
  addFilledOrder: (orderData: LocalOrderDraft) => LocalOrder;
  addRejectedOrder: (orderData: LocalOrderDraft) => LocalOrder;
  clearOrders: () => void;
  isActive: boolean;
  isLoadingProducts: boolean;
  productsError: string | null;
  onRetryProducts: () => void;
  onOpenApp: (appId: DesktopAppId) => void;
};

export type LocalOrder = {
  id: string;
  timestamp: string;
  productId: number;
  productName: string;
  side: OrderSide;
  quantity: number;
  price: number;
  status: LocalOrderStatus;
  errorMessage?: string;
  errorStatus?: number;
  errorDetails?: string;
  source: "LOCAL";
};

export type LocalOrderDraft = {
  productId: number;
  productName: string;
  side: OrderSide;
  quantity: number;
  price: number;
  errorMessage?: string;
  errorStatus?: number;
  errorDetails?: string;
};
