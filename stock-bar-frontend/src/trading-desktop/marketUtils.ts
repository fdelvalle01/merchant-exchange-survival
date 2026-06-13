import type { TradingInstrument, Trend } from "./types";

export const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

export function normalizeInstrument(
  product: Partial<TradingInstrument>,
  index = 0
): TradingInstrument {
  const basePrice = Number(product.basePrice ?? product.currentPrice ?? 0);
  const currentPrice = Number(product.currentPrice ?? basePrice);
  const id = product.id ?? product.name ?? `instrument-${index}`;

  return {
    id,
    name: product.name ?? "Unnamed",
    basePrice,
    currentPrice,
    enabled: product.enabled ?? true,
    createdAt: product.createdAt,
    lastPurchasedAt: product.lastPurchasedAt,
    priceChange:
      typeof product.priceChange === "number"
        ? product.priceChange
        : currentPrice - basePrice,
    percentageChange:
      typeof product.percentageChange === "number"
        ? product.percentageChange
        : basePrice > 0
          ? ((currentPrice - basePrice) / basePrice) * 100
          : 0,
    trend: product.trend,
    imageUrl: product.imageUrl,
    sector: product.sector,
    maxPrice: Number(product.maxPrice ?? currentPrice),
    percentageDropFromMax: Number(product.percentageDropFromMax ?? 0),
    history: product.history
  };
}

export function changeFor(instrument: TradingInstrument) {
  if (typeof instrument.priceChange === "number") return instrument.priceChange;
  return instrument.currentPrice - instrument.basePrice;
}

export function percentFor(instrument: TradingInstrument) {
  if (typeof instrument.percentageChange === "number") return instrument.percentageChange;
  if (!instrument.basePrice) return 0;
  return ((instrument.currentPrice - instrument.basePrice) / instrument.basePrice) * 100;
}

export function trendFor(instrument: TradingInstrument): Trend {
  const percent = percentFor(instrument);

  if (instrument.trend === "up" || instrument.trend === "down" || instrument.trend === "flat") {
    return instrument.trend;
  }

  if (percent > 0) return "up";
  if (percent < 0) return "down";
  return "flat";
}

export function valueClass(value: number) {
  if (value > 0) return "mes-positive";
  if (value < 0) return "mes-negative";
  return "mes-neutral";
}

export function signalFor(instrument: TradingInstrument) {
  const percent = percentFor(instrument);
  if (percent >= 2) return "BUY";
  if (percent <= -2) return "WATCH";
  return "HOLD";
}
