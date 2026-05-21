import type { TradingInstrument } from "./types";

export const mockInstruments: TradingInstrument[] = [
  {
    id: "mock-lager",
    name: "Lager Draft",
    basePrice: 4200,
    currentPrice: 4620,
    priceChange: 420,
    percentageChange: 10,
    trend: "up",
    maxPrice: 4850,
    percentageDropFromMax: 4.74,
    history: [
      { timestamp: "2026-05-21T18:00:00", price: 4100 },
      { timestamp: "2026-05-21T18:05:00", price: 4260 },
      { timestamp: "2026-05-21T18:10:00", price: 4520 },
      { timestamp: "2026-05-21T18:15:00", price: 4620 }
    ]
  },
  {
    id: "mock-ipa",
    name: "House IPA",
    basePrice: 5200,
    currentPrice: 4990,
    priceChange: -210,
    percentageChange: -4.04,
    trend: "down",
    maxPrice: 5480,
    percentageDropFromMax: 8.94,
    history: [
      { timestamp: "2026-05-21T18:00:00", price: 5320 },
      { timestamp: "2026-05-21T18:05:00", price: 5200 },
      { timestamp: "2026-05-21T18:10:00", price: 5060 },
      { timestamp: "2026-05-21T18:15:00", price: 4990 }
    ]
  },
  {
    id: "mock-stout",
    name: "Black Stout",
    basePrice: 5600,
    currentPrice: 5600,
    priceChange: 0,
    percentageChange: 0,
    trend: "flat",
    maxPrice: 5750,
    percentageDropFromMax: 2.61,
    history: [
      { timestamp: "2026-05-21T18:00:00", price: 5520 },
      { timestamp: "2026-05-21T18:05:00", price: 5580 },
      { timestamp: "2026-05-21T18:10:00", price: 5600 },
      { timestamp: "2026-05-21T18:15:00", price: 5600 }
    ]
  },
  {
    id: "mock-pilsner",
    name: "Pilsner Reserve",
    basePrice: 4500,
    currentPrice: 4815,
    priceChange: 315,
    percentageChange: 7,
    trend: "up",
    maxPrice: 4815,
    percentageDropFromMax: 0,
    history: [
      { timestamp: "2026-05-21T18:00:00", price: 4500 },
      { timestamp: "2026-05-21T18:05:00", price: 4580 },
      { timestamp: "2026-05-21T18:10:00", price: 4720 },
      { timestamp: "2026-05-21T18:15:00", price: 4815 }
    ]
  }
];
