import { desktopApps } from "../desktopApps";
import DesktopWindowFrame from "./DesktopWindowFrame";
import type {
  DesktopAppId,
  DesktopWindow,
  DesktopUser,
  LocalOrder,
  LocalOrderDraft,
  MarketEvent,
  MarketEventDraft,
  PortfolioHoldingResponse,
  PlayerCompanyResponse,
  RelicResponse,
  SealedAuctionResponse,
  TradingInstrument,
  WorldNewsItem
} from "../types";

type WorkspaceProps = {
  currentUser: DesktopUser;
  windows: DesktopWindow[];
  focusedWindowId: string | null;
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
  onCloseWindow: (windowId: string) => void;
  onFocusWindow: (windowId: string) => void;
  onMinimizeWindow: (windowId: string) => void;
  onWindowPositionChange: (windowId: string, x: number, y: number) => void;
  onWindowSizeChange: (windowId: string, width: number, height: number) => void;
};

export default function Workspace({
  currentUser,
  windows,
  focusedWindowId,
  company,
  portfolio,
  products,
  selectedProduct,
  onSelectProduct,
  onOrderCreated,
  onProductsChanged,
  onCompanyChanged,
  onPortfolioChanged,
  onOrdersChanged,
  onNewsChanged,
  onMarketEventsChanged,
  onGameItemsChanged,
  localOrders,
  addFilledOrder,
  addRejectedOrder,
  clearOrders,
  isLoadingOrders,
  ordersError,
  worldNews,
  isLoadingNews,
  newsError,
  marketEvents,
  addMarketEvent,
  clearMarketEvents,
  isLoadingCompany,
  companyError,
  isLoadingPortfolio,
  portfolioError,
  isLoadingProducts,
  productsError,
  relics,
  activeAuction,
  isLoadingRelics,
  relicsError,
  onOpenAuction,
  onRetryProducts,
  onOpenApp,
  onCloseWindow,
  onFocusWindow,
  onMinimizeWindow,
  onWindowPositionChange,
  onWindowSizeChange
}: WorkspaceProps) {
  const visibleWindows = windows.filter((window) => !window.minimized);

  return (
    <main className="mes-workspace">
      {windows.length === 0 && (
        <div className="mes-workspace-empty">
          <div className="mes-workspace-empty__panel">
            <h2 className="mes-workspace-empty__title">
              Trading desk closed
            </h2>
            <p className="mes-workspace-empty__copy">
              Open an application from the dock to begin reading the kingdom exchange.
            </p>
          </div>
        </div>
      )}

      {windows.length > 0 && visibleWindows.length === 0 && (
        <div className="mes-workspace-empty">
          <div className="mes-workspace-empty__panel">
            <h2 className="mes-workspace-empty__title">
              Windows minimized
            </h2>
            <p className="mes-workspace-empty__copy">
              Restore a window from the lower status bar.
            </p>
          </div>
        </div>
      )}

      {visibleWindows.map((window) => {
        const app = desktopApps[window.appId];
        const AppComponent = app.component;

        return (
          <DesktopWindowFrame
            key={window.id}
            window={window}
            minWidth={app.minSize.width}
            minHeight={app.minSize.height}
            icon={app.icon}
            isFocused={focusedWindowId === window.id}
            onFocus={onFocusWindow}
            onClose={onCloseWindow}
            onMinimize={onMinimizeWindow}
            onPositionChange={onWindowPositionChange}
            onSizeChange={onWindowSizeChange}
          >
            <AppComponent
              currentUser={currentUser}
              company={company}
              portfolio={portfolio}
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={onSelectProduct}
              onOrderCreated={onOrderCreated}
              onProductsChanged={onProductsChanged}
              onCompanyChanged={onCompanyChanged}
              onPortfolioChanged={onPortfolioChanged}
              onOrdersChanged={onOrdersChanged}
              onNewsChanged={onNewsChanged}
              onMarketEventsChanged={onMarketEventsChanged}
              onGameItemsChanged={onGameItemsChanged}
              localOrders={localOrders}
              addFilledOrder={addFilledOrder}
              addRejectedOrder={addRejectedOrder}
              clearOrders={clearOrders}
              isLoadingOrders={isLoadingOrders}
              ordersError={ordersError}
              worldNews={worldNews}
              isLoadingNews={isLoadingNews}
              newsError={newsError}
              marketEvents={marketEvents}
              addMarketEvent={addMarketEvent}
              clearMarketEvents={clearMarketEvents}
              isActive={focusedWindowId === window.id}
              isLoadingCompany={isLoadingCompany}
              companyError={companyError}
              isLoadingPortfolio={isLoadingPortfolio}
              portfolioError={portfolioError}
              isLoadingProducts={isLoadingProducts}
              productsError={productsError}
              relics={relics}
              activeAuction={activeAuction}
              isLoadingRelics={isLoadingRelics}
              relicsError={relicsError}
              onOpenAuction={onOpenAuction}
              onRetryProducts={onRetryProducts}
              onOpenApp={onOpenApp}
            />
          </DesktopWindowFrame>
        );
      })}
    </main>
  );
}
