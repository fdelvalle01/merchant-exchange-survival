import type { ComponentType } from "react";
import { FaChartBar, FaExchangeAlt, FaListAlt, FaSearch, FaUserShield } from "react-icons/fa";
import { canOpenDesktopApp } from "../desktopApps";
import type { DesktopAppId, UserRole } from "../types";

type SidebarProps = {
  focusedApp: DesktopAppId | null;
  openAppIds: DesktopAppId[];
  userRoles: UserRole[];
  onOpenApp: (appId: DesktopAppId) => void;
};

const apps: Array<{
  id: DesktopAppId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "market", label: "Market", icon: FaChartBar },
  { id: "ticket", label: "Ticket", icon: FaExchangeAlt },
  { id: "detail", label: "Detail", icon: FaSearch },
  { id: "orders", label: "Orders", icon: FaListAlt },
  { id: "admin", label: "Admin", icon: FaUserShield }
];

export default function Sidebar({ focusedApp, openAppIds, userRoles, onOpenApp }: SidebarProps) {
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
              className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[11px] transition ${
                isFocused
                  ? "border-amber-600/60 bg-amber-500/10 text-amber-200 shadow-inner"
                  : isOpen
                  ? "border-[#4a3323] bg-[#17100b] text-stone-200"
                  : "border-transparent text-stone-500 hover:border-[#4a3323] hover:bg-[#17100b] hover:text-stone-100"
              }`}
            >
              <Icon className="text-base" />
              <span>{app.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-[#3b2a1f] bg-black/30 p-2 text-center font-mono text-[10px] text-amber-700">
        SBX
      </div>
    </aside>
  );
}
