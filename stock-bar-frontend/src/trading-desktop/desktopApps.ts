import type { ComponentType } from "react";
import { FaChartBar, FaExchangeAlt, FaListAlt, FaSearch } from "react-icons/fa";
import MarketBoardApp from "./apps/MarketBoardApp";
import MyOrdersApp from "./apps/MyOrdersApp";
import OrderTicketApp from "./apps/OrderTicketApp";
import ProductDetailApp from "./apps/ProductDetailApp";
import type { DesktopAppId, DesktopAppRenderProps } from "./types";

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
};

export const desktopApps: Record<DesktopAppId, DesktopAppDefinition> = {
  market: {
    id: "market",
    title: "Market Board",
    component: MarketBoardApp,
    defaultPosition: { x: 18, y: 18 },
    defaultSize: { width: 900, height: 560 },
    minSize: { width: 620, height: 320 },
    icon: FaChartBar
  },
  ticket: {
    id: "ticket",
    title: "Order Ticket",
    component: OrderTicketApp,
    defaultPosition: { x: 950, y: 28 },
    defaultSize: { width: 390, height: 590 },
    minSize: { width: 330, height: 420 },
    icon: FaExchangeAlt
  },
  detail: {
    id: "detail",
    title: "Product Detail",
    component: ProductDetailApp,
    defaultPosition: { x: 420, y: 70 },
    defaultSize: { width: 620, height: 620 },
    minSize: { width: 420, height: 420 },
    icon: FaSearch
  },
  orders: {
    id: "orders",
    title: "My Orders",
    component: MyOrdersApp,
    defaultPosition: { x: 140, y: 300 },
    defaultSize: { width: 780, height: 420 },
    minSize: { width: 560, height: 300 },
    icon: FaListAlt
  }
};
