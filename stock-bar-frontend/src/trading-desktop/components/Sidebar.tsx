import type { ComponentType } from "react";
import { canOpenDesktopApp, desktopApps } from "../desktopApps";
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
  fullLabel: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "company", label: "Company", fullLabel: "Company Keep", icon: desktopApps.company.icon },
  { id: "market", label: "Market", fullLabel: "Market Board", icon: desktopApps.market.icon },
  { id: "ticket", label: "Ticket", fullLabel: "Royal Ticket", icon: desktopApps.ticket.icon },
  { id: "detail", label: "Asset", fullLabel: "Asset Chronicle", icon: desktopApps.detail.icon },
  { id: "portfolio", label: "Vault", fullLabel: "Vault Portfolio", icon: desktopApps.portfolio.icon },
  { id: "orders", label: "Ledger", fullLabel: "Trade Ledger", icon: desktopApps.orders.icon },
  { id: "herald", label: "Herald", fullLabel: "Guild Herald", icon: desktopApps.herald.icon },
  { id: "admin", label: "GM", fullLabel: "Game Master Controls", icon: desktopApps.admin.icon }
];

export default function Sidebar({
  focusedApp,
  openAppIds,
  userRoles,
  unreadNewsCount,
  onOpenApp
}: SidebarProps) {
  return (
    <aside className="mes-dock" aria-label="Trading desk applications">
      <div className="mes-dock__apps">
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
              title={app.fullLabel}
              aria-label={`Open ${app.fullLabel}`}
              aria-pressed={isOpen}
              onClick={() => onOpenApp(app.id)}
              className={`mes-dock__button ${isOpen ? "is-open" : ""} ${
                isFocused ? "is-focused" : ""
              }`}
            >
              <Icon className="mes-dock__icon" aria-hidden="true" />
              <span>{app.label}</span>
              {app.id === "herald" && unreadNewsCount > 0 && (
                <span className="mes-dock__badge">
                  {unreadNewsCount > 9 ? "9+" : unreadNewsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mes-dock__seal" title="Merchant Exchange Survival">
        MES
      </div>
    </aside>
  );
}
