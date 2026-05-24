import type { ComponentType } from "react";
import { FaChartBar, FaExchangeAlt, FaListAlt, FaSearch, FaUserShield } from "react-icons/fa";
import AdminMarketControlsApp from "./apps/AdminMarketControlsApp";
import MarketBoardApp from "./apps/MarketBoardApp";
import MyOrdersApp from "./apps/MyOrdersApp";
import OrderTicketApp from "./apps/OrderTicketApp";
import ProductDetailApp from "./apps/ProductDetailApp";
import type { DesktopAppId, DesktopAppRenderProps, UserRole } from "./types";

export type DesktopAppDefinition = {
  id: DesktopAppId;
  title: string;
  component: ComponentType<DesktopAppRenderProps>;
  defaultPosition: {
    x: number;
    y: number;
  };
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  icon: ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
};

export const desktopApps: Record<DesktopAppId, DesktopAppDefinition> = {
  market: {
    id: "market",
    title: "Market Board",
    component: MarketBoardApp,
    defaultPosition: { x: 18, y: 18 },
    defaultSize: { width: 900, height: 560 },
    minSize: { width: 620, height: 320 },
    icon: FaChartBar,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  ticket: {
    id: "ticket",
    title: "Order Ticket",
    component: OrderTicketApp,
    defaultPosition: { x: 950, y: 28 },
    defaultSize: { width: 390, height: 590 },
    minSize: { width: 330, height: 420 },
    icon: FaExchangeAlt,
    allowedRoles: ["TRADER", "ADMIN_BAR"]
  },
  detail: {
    id: "detail",
    title: "Product Detail",
    component: ProductDetailApp,
    defaultPosition: { x: 420, y: 70 },
    defaultSize: { width: 620, height: 620 },
    minSize: { width: 420, height: 420 },
    icon: FaSearch,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  orders: {
    id: "orders",
    title: "My Orders",
    component: MyOrdersApp,
    defaultPosition: { x: 140, y: 300 },
    defaultSize: { width: 780, height: 420 },
    minSize: { width: 560, height: 300 },
    icon: FaListAlt,
    allowedRoles: ["TRADER", "ADMIN_BAR"]
  },
  admin: {
    id: "admin",
    title: "Admin Market Controls",
    component: AdminMarketControlsApp,
    defaultPosition: { x: 170, y: 80 },
    defaultSize: { width: 980, height: 680 },
    minSize: { width: 760, height: 520 },
    icon: FaUserShield,
    allowedRoles: ["ADMIN_BAR"]
  }
};

export function canOpenDesktopApp(appId: DesktopAppId, roles: UserRole[]) {
  const allowedRoles = desktopApps[appId].allowedRoles;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return roles.some((role) => allowedRoles.includes(role));
}
