import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartLine, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import type { DesktopUser, FeedMode } from "../types";

type TopBarProps = {
  isLiveData: boolean;
  feedMode: FeedMode;
  currentUser: DesktopUser;
  gameDay?: number;
  onLogout: () => void;
};

function feedLabel(feedMode: FeedMode) {
  if (feedMode === "products-api") return "Assets API";
  return "Offline";
}

function roleLabel(user: DesktopUser) {
  return user.role === "UNASSIGNED" ? "SIN ROL" : user.role;
}

export default function TopBar({
  isLiveData,
  feedMode,
  currentUser,
  gameDay,
  onLogout
}: TopBarProps) {
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
    <header className="mes-topbar">
      <div className="mes-brand">
        <div className="mes-brand__emblem" aria-hidden="true">
          <img src="/branding/merchant-logo.png" alt="" />
        </div>
        <div className="min-w-0">
          <div className="mes-brand__title">
            MERCHANT EXCHANGE SURVIVAL
          </div>
          <div className="mes-brand__subtitle">
            Royal Trading Desk · Guild Charter MES-01
          </div>
        </div>
      </div>

      <nav className="mes-topbar__legacy" aria-label="Legacy views">
        <Link
          to="/products"
          className="mes-topbar__link"
        >
          Assets
        </Link>
        <Link
          to="/board"
          className="mes-topbar__link"
        >
          Classic board
        </Link>
      </nav>

      <div className="mes-topbar__spacer" />

      {gameDay !== undefined && (
        <div className="mes-topbar__plate mes-topbar__day" title="Current game day">
          DAY {gameDay}
        </div>
      )}

      <div className="mes-topbar__plate mes-topbar__account">
          <FaUserShield className="text-amber-500" aria-hidden="true" />
          <span className="mes-topbar__username">{currentUser.username}</span>
          <span className="mes-topbar__role">{roleLabel(currentUser)}</span>
      </div>

      <div className="mes-topbar__plate mes-topbar__account mes-topbar__feed">
          <FaChartLine className={isLiveData ? "text-emerald-300" : "text-amber-300"} aria-hidden="true" />
          <span>{feedLabel(feedMode)}</span>
      </div>

      <div className="mes-topbar__plate mes-topbar__clock" title="Local time">
        {time}
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mes-topbar__logout"
        title="Logout"
        aria-label="Logout"
      >
        <FaSignOutAlt aria-hidden="true" />
      </button>
    </header>
  );
}
