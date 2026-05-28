import type { ComponentType } from "react";
import { FaBriefcase, FaChartBar, FaExchangeAlt, FaListAlt, FaNewspaper, FaSearch, FaUserShield, FaWallet } from "react-icons/fa";
import { canOpenDesktopApp } from "../desktopApps";
import type { DesktopAppId, UserRole } from "../types";

type SidebarProps = {
  focusedApp: DesktopAppId | null;
  openAppIds: DesktopAppId[];
  userRoles: UserRole[];
  unreadNewsCount: number;
  onOpenApp: (appId: DesktopAppId) => void;
};

const apps: Array<{
  id: DesktopAppId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "company", label: "Company", icon: FaBriefcase },
  { id: "market", label: "Market", icon: FaChartBar },
  { id: "ticket", label: "Ticket", icon: FaExchangeAlt },
  { id: "detail", label: "Asset", icon: FaSearch },
  { id: "portfolio", label: "Portfolio", icon: FaWallet },
  { id: "orders", label: "Trades", icon: FaListAlt },
  { id: "herald", label: "News", icon: FaNewspaper },
  { id: "admin", label: "GM", icon: FaUserShield }
];

export default function Sidebar({
  focusedApp,
  openAppIds,
  userRoles,
  unreadNewsCount,
  onOpenApp
}: SidebarProps) {
  return (
    <aside className="flex min-h-0 w-[82px] shrink-0 flex-col border-r border-[#3b2a1f] bg-[#0d0906] px-2 py-3">
      <div className="flex flex-1 flex-col gap-2">
        {apps
          .filter((app) => canOpenDesktopApp(app.id, userRoles))
          .map((app) => {
          const Icon = app.icon;
          const isOpen = openAppIds.includes(app.id);
          const isFocused = focusedApp === app.id;

          return (
            <button
              key={app.id}
              type="button"
              title={app.label}
              onClick={() => onOpenApp(app.id)}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[11px] transition ${
                isFocused
                  ? "border-amber-600/60 bg-amber-500/10 text-amber-200 shadow-inner"
                  : isOpen
                  ? "border-[#4a3323] bg-[#17100b] text-stone-200"
                  : "border-transparent text-stone-500 hover:border-[#4a3323] hover:bg-[#17100b] hover:text-stone-100"
              }`}
            >
              <Icon className="text-base" />
              <span>{app.label}</span>
              {app.id === "herald" && unreadNewsCount > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full border border-red-300/60 bg-red-500 px-1 font-mono text-[10px] font-semibold text-white">
                  {unreadNewsCount > 9 ? "9+" : unreadNewsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-[#3b2a1f] bg-black/30 p-2 text-center font-mono text-[10px] text-amber-700">
        MES
      </div>
    </aside>
  );
}
