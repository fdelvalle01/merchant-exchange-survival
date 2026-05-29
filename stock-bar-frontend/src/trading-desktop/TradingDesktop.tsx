import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { canOpenDesktopApp } from "./desktopApps";
import { useCompany } from "./hooks/useCompany";
import { useDesktopWindows } from "./hooks/useDesktopWindows";
import { useLocalOrders } from "./hooks/useLocalOrders";
import { useMarketEvents } from "./hooks/useMarketEvents";
import { usePortfolio } from "./hooks/usePortfolio";
import { useProductsFeed } from "./hooks/useProductsFeed";
import { useWorldNews } from "./hooks/useWorldNews";
import type { DesktopAppId, DesktopUser, TradingInstrument, WorldNewsItem } from "./types";
import NewsToasts from "./components/NewsToasts";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import TickerTape from "./components/TickerTape";
import TopBar from "./components/TopBar";
import Workspace from "./components/Workspace";

export default function TradingDesktop() {
  const { user, hasAnyRole, logout } = useAuth();
  const currentUser: DesktopUser = user ?? {
    name: "Unknown",
    username: "unknown",
    role: "UNASSIGNED",
    roles: []
  };
  const canUseOrders = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");
  const initialApps: DesktopAppId[] = hasAnyRole(["TRADER", "ADMIN_BAR"])
    ? ["company", "market", "ticket"]
    : hasAnyRole(["VIEWER"])
    ? ["company", "market", "detail"]
    : [];
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<TradingInstrument["id"]>();
  const [newsToasts, setNewsToasts] = useState<WorldNewsItem[]>([]);
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const handleNewNews = useCallback((items: WorldNewsItem[]) => {
    setNewsToasts((currentItems) => {
      const currentIds = new Set(currentItems.map((item) => item.id));
      return [...items.filter((item) => !currentIds.has(item.id)), ...currentItems].slice(0, 6);
    });
    setUnreadNewsCount((currentCount) => Math.min(currentCount + items.length, 99));
  }, []);
  const {
    windows,
    focusedWindowId,
    focusedWindow,
    openAppIds,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize
  } = useDesktopWindows(initialApps);
  const {
    products,
    isLoading,
    error,
    feedMode,
    refreshProducts
  } = useProductsFeed();
  const {
    company,
    isLoadingCompany,
    companyError,
    refreshCompany
  } = useCompany();
  const {
    portfolio,
    isLoadingPortfolio,
    portfolioError,
    refreshPortfolio
  } = usePortfolio();
  const {
    orders,
    isLoadingOrders,
    ordersError,
    refreshOrders,
    addFilledOrder,
    addRejectedOrder,
    clearOrders
  } = useLocalOrders(canUseOrders);
  const {
    events: marketEvents,
    addMarketEvent,
    clearMarketEvents
  } = useMarketEvents();
  const {
    worldNews,
    isLoadingNews,
    newsError,
    refreshNews
  } = useWorldNews(handleNewNews);
  const userRolesKey = currentUser.roles.join("|");

  useEffect(() => {
    if (products.length === 0) return;

    const selectedStillExists = products.some(
      (instrument) => String(instrument.id) === String(selectedInstrumentId)
    );

    if (!selectedInstrumentId || !selectedStillExists) {
      setSelectedInstrumentId(products[0].id);
    }
  }, [products, selectedInstrumentId]);

  useEffect(() => {
    windows.forEach((window) => {
      if (!canOpenDesktopApp(window.appId, currentUser.roles)) {
        closeWindow(window.id);
      }
    });
  }, [closeWindow, userRolesKey, windows]);

  const selectedInstrument = products.find(
    (instrument) => String(instrument.id) === String(selectedInstrumentId)
  );
  const isLiveData = feedMode === "products-api";
  const refreshTradingState = async () => {
    await Promise.all([refreshProducts(), refreshCompany(), refreshPortfolio(), refreshOrders(), refreshNews()]);
  };
  const openAllowedWindow = (appId: DesktopAppId) => {
    if (!canOpenDesktopApp(appId, currentUser.roles)) return;
    if (appId === "herald") {
      setUnreadNewsCount(0);
    }
    openWindow(appId);
  };
  const dismissNewsToast = (id: number) => {
    setNewsToasts((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (focusedWindow?.appId === "herald") {
      setUnreadNewsCount(0);
    }
  }, [focusedWindow?.appId]);

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-[#060403] text-stone-100">
      <TopBar
        isLiveData={isLiveData}
        feedMode={feedMode}
        currentUser={currentUser}
        onLogout={logout}
      />
      <TickerTape instruments={products} />
      <div className="grid min-h-0 flex-1 grid-cols-[82px_minmax(0,1fr)]">
        <Sidebar
          focusedApp={focusedWindow?.appId ?? null}
          openAppIds={openAppIds}
          userRoles={currentUser.roles}
          unreadNewsCount={unreadNewsCount}
          onOpenApp={openAllowedWindow}
        />
        <Workspace
          currentUser={currentUser}
          windows={windows}
          focusedWindowId={focusedWindowId}
          company={company}
          portfolio={portfolio}
          products={products}
          selectedProduct={selectedInstrument}
          onSelectProduct={(product) => setSelectedInstrumentId(product.id)}
          onOrderCreated={refreshTradingState}
          onProductsChanged={refreshProducts}
          onCompanyChanged={refreshCompany}
          onPortfolioChanged={refreshPortfolio}
          onOrdersChanged={refreshOrders}
          onNewsChanged={refreshNews}
          localOrders={orders}
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
          isLoadingCompany={isLoadingCompany}
          companyError={companyError}
          isLoadingPortfolio={isLoadingPortfolio}
          portfolioError={portfolioError}
          isLoadingProducts={isLoading}
          productsError={error}
          onRetryProducts={refreshProducts}
          onOpenApp={openAllowedWindow}
          onCloseWindow={closeWindow}
          onFocusWindow={focusWindow}
          onMinimizeWindow={minimizeWindow}
          onWindowPositionChange={updateWindowPosition}
          onWindowSizeChange={updateWindowSize}
        />
      </div>
      <NewsToasts
        items={newsToasts}
        portfolio={portfolio}
        products={products}
        onDismiss={dismissNewsToast}
        onOpenNews={() => openAllowedWindow("herald")}
      />
      <StatusBar
        isLiveData={isLiveData}
        isLoadingProducts={isLoading}
        feedMode={feedMode}
        instrumentCount={products.length}
        windowCount={windows.length}
        orderCount={orders.length}
        minimizedWindows={windows.filter((window) => window.minimized)}
        onRestoreWindow={restoreWindow}
      />
    </div>
  );
}
