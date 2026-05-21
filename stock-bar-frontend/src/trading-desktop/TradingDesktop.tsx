import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, normalizeInstrument } from "./marketUtils";
import type { DesktopAppId, FeedMode, TradingInstrument } from "./types";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import TickerTape from "./components/TickerTape";
import TopBar from "./components/TopBar";
import Workspace from "./components/Workspace";

export default function TradingDesktop() {
  const [activeApp, setActiveApp] = useState<DesktopAppId>("market");
  const [productFeed, setProductFeed] = useState<TradingInstrument[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("offline");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<TradingInstrument["id"]>();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      if (Array.isArray(response.data)) {
        setProductFeed(response.data.map(normalizeInstrument));
        setFeedMode("products-api");
      }
    } catch (error) {
      console.error("Could not load products feed", error);
      setProductFeed([]);
      setFeedMode("offline");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = window.setInterval(fetchProducts, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchProducts]);

  const instruments = productFeed;

  useEffect(() => {
    if (instruments.length === 0) return;

    const selectedStillExists = instruments.some(
      (instrument) => String(instrument.id) === String(selectedInstrumentId)
    );

    if (!selectedInstrumentId || !selectedStillExists) {
      setSelectedInstrumentId(instruments[0].id);
    }
  }, [instruments, selectedInstrumentId]);

  const selectedInstrument = instruments.find(
    (instrument) => String(instrument.id) === String(selectedInstrumentId)
  );
  const isLiveData = feedMode === "products-api";

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-[#060403] text-stone-100">
      <TopBar isLiveData={isLiveData} feedMode={feedMode} />
      <TickerTape instruments={instruments} />
      <div className="grid min-h-0 flex-1 grid-cols-[82px_minmax(0,1fr)]">
        <Sidebar activeApp={activeApp} onOpenApp={setActiveApp} />
        <Workspace
          activeApp={activeApp}
          instruments={instruments}
          selectedInstrument={selectedInstrument}
          onSelectInstrument={(instrument) => setSelectedInstrumentId(instrument.id)}
          onOrderSubmitted={fetchProducts}
        />
      </div>
      <StatusBar isLiveData={isLiveData} feedMode={feedMode} instrumentCount={instruments.length} />
    </div>
  );
}
