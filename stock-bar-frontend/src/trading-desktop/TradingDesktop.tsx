import { useEffect, useState } from "react";
import { useDesktopWindows } from "./hooks/useDesktopWindows";
import { useLocalOrders } from "./hooks/useLocalOrders";
import { useProductsFeed } from "./hooks/useProductsFeed";
import type { TradingInstrument } from "./types";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import TickerTape from "./components/TickerTape";
import TopBar from "./components/TopBar";
import Workspace from "./components/Workspace";

export default function TradingDesktop() {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<TradingInstrument["id"]>();
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
  } = useDesktopWindows();
  const {
    products,
    isLoading,
    error,
    feedMode,
    refreshProducts
  } = useProductsFeed();
  const {
    orders,
    addFilledOrder,
    addRejectedOrder,
    clearOrders
  } = useLocalOrders();

  useEffect(() => {
    if (products.length === 0) return;

    const selectedStillExists = products.some(
      (instrument) => String(instrument.id) === String(selectedInstrumentId)
    );

    if (!selectedInstrumentId || !selectedStillExists) {
      setSelectedInstrumentId(products[0].id);
    }
  }, [products, selectedInstrumentId]);

  const selectedInstrument = products.find(
    (instrument) => String(instrument.id) === String(selectedInstrumentId)
  );
  const isLiveData = feedMode === "products-api";

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-[#060403] text-stone-100">
      <TopBar isLiveData={isLiveData} feedMode={feedMode} />
      <TickerTape instruments={products} />
      <div className="grid min-h-0 flex-1 grid-cols-[82px_minmax(0,1fr)]">
        <Sidebar
          focusedApp={focusedWindow?.appId ?? null}
          openAppIds={openAppIds}
          onOpenApp={openWindow}
        />
        <Workspace
          windows={windows}
          focusedWindowId={focusedWindowId}
          products={products}
          selectedProduct={selectedInstrument}
          onSelectProduct={(product) => setSelectedInstrumentId(product.id)}
          onOrderCreated={refreshProducts}
          localOrders={orders}
          addFilledOrder={addFilledOrder}
          addRejectedOrder={addRejectedOrder}
          clearOrders={clearOrders}
          isLoadingProducts={isLoading}
          productsError={error}
          onRetryProducts={refreshProducts}
          onOpenApp={openWindow}
          onCloseWindow={closeWindow}
          onFocusWindow={focusWindow}
          onMinimizeWindow={minimizeWindow}
          onWindowPositionChange={updateWindowPosition}
          onWindowSizeChange={updateWindowSize}
        />
      </div>
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
