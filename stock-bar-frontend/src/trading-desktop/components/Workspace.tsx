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
    <main
      className="relative min-h-0 overflow-hidden bg-[#070504]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 16% 0%, rgba(132, 85, 38, 0.16), transparent 30%), radial-gradient(circle at 78% 22%, rgba(91, 76, 55, 0.14), transparent 28%), linear-gradient(180deg, #080604 0%, #050403 100%)"
      }}
    >
      {windows.length === 0 && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-md rounded-md border border-[#3b2a1f] bg-black/25 p-6 shadow-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
              Workspace vacio
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Abre Market o Ticket desde el sidebar para comenzar a operar activos.
            </p>
          </div>
        </div>
      )}

      {windows.length > 0 && visibleWindows.length === 0 && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-md rounded-md border border-[#3b2a1f] bg-black/25 p-6 shadow-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
              Ventanas minimizadas
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Restaura una ventana desde la barra inferior.
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
              onRetryProducts={onRetryProducts}
              onOpenApp={onOpenApp}
            />
          </DesktopWindowFrame>
        );
      })}
    </main>
  );
}
