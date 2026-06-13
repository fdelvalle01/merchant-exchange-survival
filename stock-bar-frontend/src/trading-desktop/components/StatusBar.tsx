import { useEffect, useState } from "react";
import type { DesktopWindow, FeedMode } from "../types";

type StatusBarProps = {
  isLiveData: boolean;
  isLoadingProducts: boolean;
  feedMode: FeedMode;
  instrumentCount: number;
  windowCount: number;
  orderCount: number;
  minimizedWindows: DesktopWindow[];
  onRestoreWindow: (windowId: string) => void;
};

function feedLabel(feedMode: FeedMode) {
  if (feedMode === "products-api") return "ASSETS API";
  return "OFFLINE";
}

function connectionLabel(isLoadingProducts: boolean, isLiveData: boolean) {
  if (isLoadingProducts) return "LOADING";
  if (isLiveData) return "CONNECTED";
  return "BACKEND OFFLINE";
}

function connectionDotClass(isLoadingProducts: boolean, isLiveData: boolean) {
  if (isLoadingProducts) return "is-loading";
  if (isLiveData) return "is-live";
  return "";
}

export default function StatusBar({
  isLiveData,
  isLoadingProducts,
  feedMode,
  instrumentCount,
  windowCount,
  orderCount,
  minimizedWindows,
  onRestoreWindow
}: StatusBarProps) {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(clock);

  return (
    <footer className="mes-statusbar">
      <div className="mes-statusbar__connection">
        <span className={`mes-statusbar__dot ${connectionDotClass(isLoadingProducts, isLiveData)}`} />
        <span>{connectionLabel(isLoadingProducts, isLiveData)}</span>
      </div>
      <div className="mes-statusbar__group mes-statusbar__secondary">
        <span>{feedLabel(feedMode)}</span>
        <span>ASSETS {instrumentCount}</span>
        <span>WINDOWS {windowCount}</span>
        <span>ORDERS {orderCount}</span>
        {minimizedWindows.length > 0 && (
          <span className="mes-statusbar__minimized">
            MIN
            {minimizedWindows.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => onRestoreWindow(window.id)}
                className="mes-statusbar__restore"
                title={`Restore ${window.title}`}
              >
                {window.title}
              </button>
            ))}
          </span>
        )}
        <span>{time}</span>
      </div>
      <div className="mes-statusbar__signature">MES DESK · ROYAL EXCHANGE</div>
    </footer>
  );
}
