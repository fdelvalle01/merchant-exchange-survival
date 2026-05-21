import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBeer, FaChartLine, FaUserShield } from "react-icons/fa";
import type { FeedMode } from "../types";

type TopBarProps = {
  isLiveData: boolean;
  feedMode: FeedMode;
};

function feedLabel(feedMode: FeedMode) {
  if (feedMode === "products-api") return "Products API";
  return "Offline";
}

export default function TopBar({ isLiveData, feedMode }: TopBarProps) {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(clock);

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-[#3b2a1f] bg-[#0b0705] px-4 text-sm text-stone-200"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(83, 48, 22, 0.35), transparent 32%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 22px)"
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-amber-600/50 bg-black/30 text-amber-300 shadow-inner">
          <FaBeer aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-wide text-stone-50">
            Stock Bar Exchange
          </div>
          <div className="text-xs text-stone-500">Trading Desktop</div>
        </div>
      </div>

      <nav className="hidden items-center gap-2 md:flex">
        <Link
          to="/products"
          className="rounded-md border border-[#3b2a1f] bg-black/20 px-3 py-1.5 text-stone-400 hover:border-amber-700/50 hover:text-stone-100"
        >
          Productos
        </Link>
        <Link
          to="/board"
          className="rounded-md border border-[#3b2a1f] bg-black/20 px-3 py-1.5 text-stone-400 hover:border-amber-700/50 hover:text-stone-100"
        >
          Board clasico
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-[#3b2a1f] bg-black/25 px-3 py-1.5 text-xs text-stone-400 sm:flex">
          <FaUserShield className="text-amber-500" aria-hidden="true" />
          <span>Session: Tavern Desk</span>
        </div>
        <div className="hidden items-center gap-2 rounded-md border border-[#3b2a1f] bg-black/25 px-3 py-1.5 text-xs text-stone-400 sm:flex">
          <FaChartLine className={isLiveData ? "text-emerald-300" : "text-amber-300"} aria-hidden="true" />
          <span>{feedLabel(feedMode)}</span>
        </div>
        <div className="rounded-md border border-[#3b2a1f] bg-black/25 px-3 py-1.5 font-mono text-xs text-stone-300">
          {time}
        </div>
      </div>
    </header>
  );
}
