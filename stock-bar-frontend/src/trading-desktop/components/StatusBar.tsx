import { useEffect, useState } from "react";
import type { DesktopWindow, FeedMode } from "../types";

type StatusBarProps = {
  isLiveData: boolean;
  feedMode: FeedMode;
  instrumentCount: number;
  windowCount: number;
  minimizedWindows: DesktopWindow[];
  onRestoreWindow: (windowId: string) => void;
};

function feedLabel(feedMode: FeedMode) {
  if (feedMode === "products-api") return "PRODUCTS API";
  return "OFFLINE";
}

export default function StatusBar({
  isLiveData,
  feedMode,
  instrumentCount,
  windowCount,
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
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-[#3b2a1f] bg-[#0b0705] px-3 font-mono text-[11px] text-stone-500">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isLiveData ? "bg-emerald-300" : "bg-amber-300"}`} />
        <span>{isLiveData ? "CONNECTED" : "OFFLINE"}</span>
      </div>
      <div className="hidden items-center gap-4 sm:flex">
        <span>{feedLabel(feedMode)}</span>
        <span>ENV LOCAL</span>
        <span>INSTRUMENTS {instrumentCount}</span>
        <span>WINDOWS {windowCount}</span>
        {minimizedWindows.length > 0 && (
          <span className="flex items-center gap-1">
            MIN
            {minimizedWindows.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => onRestoreWindow(window.id)}
                className="rounded border border-[#4a3323] bg-black/20 px-2 py-0.5 text-[10px] text-amber-300 hover:border-amber-700/60"
              >
                {window.title}
              </button>
            ))}
          </span>
        )}
        <span>{time}</span>
      </div>
      <div>SBX DESKTOP v0.1</div>
    </footer>
  );
}
