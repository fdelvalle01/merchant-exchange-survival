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
  fullLabel: string;
  icon: typeof FaBriefcase;
}> = [
  { id: "company", label: "Keep", fullLabel: "Company Keep", icon: FaBriefcase },
  { id: "market", label: "Market", fullLabel: "Market Board", icon: FaChartBar },
  { id: "ticket", label: "Ticket", fullLabel: "Royal Ticket", icon: FaExchangeAlt },
  { id: "detail", label: "Asset", fullLabel: "Asset Chronicle", icon: FaSearch },
  { id: "portfolio", label: "Vault", fullLabel: "Vault Portfolio", icon: FaWallet },
  { id: "orders", label: "Ledger", fullLabel: "Trade Ledger", icon: FaListAlt },
  { id: "herald", label: "Herald", fullLabel: "Guild Herald", icon: FaNewspaper },
  { id: "admin", label: "GM", fullLabel: "Game Master Controls", icon: FaUserShield }
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
