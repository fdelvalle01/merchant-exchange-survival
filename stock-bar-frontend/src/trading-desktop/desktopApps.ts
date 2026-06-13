import type { ComponentType } from "react";
import AdminMarketControlsApp from "./apps/AdminMarketControlsApp";
import CompanyDashboardApp from "./apps/CompanyDashboardApp";
import GuildHeraldApp from "./apps/GuildHeraldApp";
import MarketBoardApp from "./apps/MarketBoardApp";
import MyOrdersApp from "./apps/MyOrdersApp";
import OrderTicketApp from "./apps/OrderTicketApp";
import PortfolioApp from "./apps/PortfolioApp";
import ProductDetailApp from "./apps/ProductDetailApp";
import type { DesktopAppId, DesktopAppRenderProps, UserRole } from "./types";
import { desktopAppIcons } from "./visualCatalog";

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
  company: {
    id: "company",
    title: "Company Keep",
    component: CompanyDashboardApp,
    defaultPosition: { x: 14, y: 14 },
    defaultSize: { width: 420, height: 510 },
    minSize: { width: 390, height: 340 },
    icon: desktopAppIcons.company,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  market: {
    id: "market",
    title: "Market Board",
    component: MarketBoardApp,
    defaultPosition: { x: 446, y: 14 },
    defaultSize: { width: 515, height: 390 },
    minSize: { width: 500, height: 300 },
    icon: desktopAppIcons.market,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  ticket: {
    id: "ticket",
    title: "Royal Ticket",
    component: OrderTicketApp,
    defaultPosition: { x: 1000, y: 14 },
    defaultSize: { width: 320, height: 540 },
    minSize: { width: 300, height: 410 },
    icon: desktopAppIcons.ticket,
    allowedRoles: ["TRADER", "ADMIN_BAR"]
  },
  detail: {
    id: "detail",
    title: "Asset Chronicle",
    component: ProductDetailApp,
    defaultPosition: { x: 420, y: 70 },
    defaultSize: { width: 620, height: 570 },
    minSize: { width: 420, height: 420 },
    icon: desktopAppIcons.detail,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  portfolio: {
    id: "portfolio",
    title: "Vault Portfolio",
    component: PortfolioApp,
    defaultPosition: { x: 220, y: 180 },
    defaultSize: { width: 840, height: 420 },
    minSize: { width: 620, height: 320 },
    icon: desktopAppIcons.portfolio,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  orders: {
    id: "orders",
    title: "Trade Ledger",
    component: MyOrdersApp,
    defaultPosition: { x: 140, y: 300 },
    defaultSize: { width: 780, height: 420 },
    minSize: { width: 560, height: 300 },
    icon: desktopAppIcons.orders,
    allowedRoles: ["TRADER", "ADMIN_BAR"]
  },
  herald: {
    id: "herald",
    title: "Guild Herald",
    component: GuildHeraldApp,
    defaultPosition: { x: 260, y: 96 },
    defaultSize: { width: 720, height: 560 },
    minSize: { width: 460, height: 360 },
    icon: desktopAppIcons.herald,
    allowedRoles: ["VIEWER", "TRADER", "ADMIN_BAR"]
  },
  admin: {
    id: "admin",
    title: "Game Master Controls",
    component: AdminMarketControlsApp,
    defaultPosition: { x: 170, y: 80 },
    defaultSize: { width: 980, height: 680 },
    minSize: { width: 760, height: 520 },
    icon: desktopAppIcons.admin,
    allowedRoles: ["ADMIN_BAR"]
  }
};

export function canOpenDesktopApp(appId: DesktopAppId, roles: UserRole[]) {
  const allowedRoles = desktopApps[appId].allowedRoles;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return roles.some((role) => allowedRoles.includes(role));
}
