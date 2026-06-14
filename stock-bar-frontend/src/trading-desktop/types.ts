import type { PlayerCompanyResponse } from "./services/companyApi";
import type { OrderResponse } from "./services/ordersApi";
import type { PortfolioHoldingResponse } from "./services/portfolioApi";
import type { RelicResponse, SealedAuctionResponse } from "./services/relicsApi";

export type { OrderResponse, PlayerCompanyResponse, PortfolioHoldingResponse };
export type { RelicResponse, SealedAuctionResponse };

export type DesktopAppId =
  | "company"
  | "market"
  | "ticket"
  | "detail"
  | "portfolio"
  | "orders"
  | "herald"
  | "admin";

export type FeedMode = "products-api" | "offline";

export type Trend = "up" | "down" | "flat";

export type UserRole = "ADMIN_BAR" | "TRADER" | "VIEWER";

export type DesktopUser = {
  name: string;
  username: string;
  role: UserRole | "UNASSIGNED";
  roles: UserRole[];
};

export type OrderSide = "BUY" | "SELL";

export type LocalOrderStatus = "FILLED" | "REJECTED" | "PENDING";

export type MarketEventStatus = "SUCCESS" | "FAILED" | "LOCAL";

export type MarketEventType =
  | "SALE_REGISTERED"
  | "ORDER_BUY_FILLED"
  | "ORDER_SELL_FILLED"
  | "ROYAL_CONTRACT"
  | "MINING_ACCIDENT"
  | "PORT_BLOCKADE"
  | "BANKING_CRISIS"
  | "HARVEST_BOOM"
  | "PLAGUE_OUTBREAK"
  | "WAR_RUMORS"
  | "MAGIC_DISCOVERY"
  | "PRICE_UPDATED"
  | "PRICE_PRESSURE_UP"
  | "PRICE_PRESSURE_DOWN"
  | "PRICE_REVERSION"
  | "MARKET_ENGINE_TICK"
  | "DAILY_BURN_APPLIED"
  | "DEBT_INTEREST_APPLIED"
  | "BANKRUPTCY_DECLARED"
  | "VICTORY_ACHIEVED"
  | "GAME_RESTARTED"
  | "SEALED_AUCTION_CREATED"
  | "SEALED_AUCTION_ENTERED"
  | "SEALED_AUCTION_RESOLVED"
  | "SEALED_AUCTION_EXPIRED"
  | "RELIC_ACQUIRED"
  | "RELIC_EQUIPPED"
  | "RELIC_UNEQUIPPED"
  | "RELIC_ACTIVATED"
  | "RELIC_CONSUMED"
  | "RELIC_DAY_TICKED"
  | "RELIC_EXPIRED"
  | "BANKRUPTCY_PREVENTED"
  | "MARKET_CRASH"
  | "MARKET_BOOM"
  | "MARKET_RESET"
  | "PRODUCT_PRICE_UP"
  | "PRODUCT_PRICE_DOWN"
  | "VOLUME_CHANGE"
  | "PRODUCT_PRICE_RESET";

export type PricePoint = {
  timestamp: string;
  price: number;
};

export type WorldEventType =
  | "ROYAL_CONTRACT"
  | "MINING_ACCIDENT"
  | "PORT_BLOCKADE"
  | "BANKING_CRISIS"
  | "HARVEST_BOOM"
  | "PLAGUE_OUTBREAK"
  | "WAR_RUMORS"
  | "MAGIC_DISCOVERY";

export type NewsSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NewsDirection = "POSITIVE" | "NEGATIVE" | "MIXED" | "NEUTRAL";

export type WorldNewsItem = {
  id: number;
  type: WorldEventType;
  category: string;
  title: string;
  summary: string;
  description: string;
  severity: NewsSeverity;
  affectedSector?: string | null;
  affectedAssetName?: string | null;
  impactPercent: number;
  direction: NewsDirection;
  isRead?: boolean;
  timestamp: string;
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
  sector?: string;
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
  currentUser: DesktopUser;
  company: PlayerCompanyResponse | null;
  portfolio: PortfolioHoldingResponse[];
  products: TradingInstrument[];
  selectedProduct?: TradingInstrument;
  onSelectProduct: (product: TradingInstrument) => void;
  onOrderCreated: () => void | Promise<void>;
  onProductsChanged: () => void | Promise<void>;
  onCompanyChanged: () => void | Promise<void>;
  onPortfolioChanged: () => void | Promise<void>;
  onOrdersChanged: () => void | Promise<void>;
  onNewsChanged: () => void | Promise<void>;
  onMarketEventsChanged: () => void | Promise<void>;
  onGameItemsChanged: () => void | Promise<void>;
  localOrders: LocalOrder[];
  addFilledOrder: (orderData: LocalOrderDraft) => LocalOrder;
  addRejectedOrder: (orderData: LocalOrderDraft) => LocalOrder;
  clearOrders: () => void;
  isLoadingOrders: boolean;
  ordersError: string | null;
  worldNews: WorldNewsItem[];
  isLoadingNews: boolean;
  newsError: string | null;
  marketEvents: MarketEvent[];
  addMarketEvent: (eventData: MarketEventDraft) => MarketEvent;
  clearMarketEvents: () => void;
  isActive: boolean;
  isLoadingCompany: boolean;
  companyError: string | null;
  isLoadingPortfolio: boolean;
  portfolioError: string | null;
  isLoadingProducts: boolean;
  productsError: string | null;
  relics: RelicResponse[];
  activeAuction: SealedAuctionResponse | null;
  isLoadingRelics: boolean;
  relicsError: string | null;
  onOpenAuction: () => void;
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
  totalAmount?: number;
  realizedPnl?: number;
  status: LocalOrderStatus;
  errorMessage?: string;
  errorStatus?: number;
  errorDetails?: string;
  source: "LOCAL" | "BACKEND";
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

export type MarketEvent = {
  id: string;
  timestamp: string;
  type: MarketEventType;
  description: string;
  user: string;
  status: MarketEventStatus;
  details?: string;
  source?: "LOCAL" | "BACKEND";
};

export type MarketEventDraft = {
  type: MarketEventType;
  description: string;
  user: string;
  status: MarketEventStatus;
  details?: string;
};
