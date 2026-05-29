import type { NewsDirection, PortfolioHoldingResponse, TradingInstrument, WorldNewsItem } from "./types";

export type HoldingImpactTone = "positive" | "negative" | "mixed" | "neutral";
export type HoldingImpactTiming = "HELD_AT_EVENT" | "POST_EVENT_ENTRY";

export type HoldingImpactMeta = {
  label: string;
  hint: string;
  tone: HoldingImpactTone;
  timing: HoldingImpactTiming;
};

function normalize(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function sectorTokens(value?: string | null) {
  const sector = normalize(value);
  if (!sector) return [];
  if (sector === "GENERAL") return ["GENERAL"];
  if (sector === "MIXED") return ["MIXED"];
  return sector.split(/[/,\s]+/).filter(Boolean);
}

function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function holdingSector(holding: PortfolioHoldingResponse, products: TradingInstrument[]) {
  const product = products.find((candidate) => Number(candidate.id) === holding.assetId);
  return normalize(product?.sector);
}

function holdingMatchesNews(
  news: WorldNewsItem,
  holding: PortfolioHoldingResponse,
  products: TradingInstrument[]
) {
  const affectedAssetName = normalize(news.affectedAssetName);
  if (affectedAssetName && normalize(holding.assetName) === affectedAssetName) {
    return true;
  }

  const affectedSectors = sectorTokens(news.affectedSector);
  if (affectedSectors.length === 0) return false;
  if (affectedSectors.includes("GENERAL")) return true;

  const sector = holdingSector(holding, products);
  if (!sector) return false;

  if (affectedSectors.includes("MIXED")) {
    return ["MINING", "BANKING", "ARCANE", "SHIPPING", "LOGISTICS", "GRAIN", "FOOD"].includes(sector);
  }

  return affectedSectors.includes(sector);
}

function affectedHoldings(
  news: WorldNewsItem,
  portfolio: PortfolioHoldingResponse[],
  products: TradingInstrument[]
) {
  return portfolio
    .filter((holding) => holding.quantity > 0)
    .filter((holding) => holdingMatchesNews(news, holding, products));
}

function holdingWasOpenAtNews(holding: PortfolioHoldingResponse, news: WorldNewsItem) {
  const holdingCreatedAt = parseTimestamp(holding.createdAt);
  const newsTimestamp = parseTimestamp(news.timestamp);

  // Backward-compatible fallback for portfolio payloads that do not yet expose holding.createdAt.
  if (holdingCreatedAt === null || newsTimestamp === null) return true;

  return holdingCreatedAt <= newsTimestamp;
}

export function newsAffectsHolding(
  news: WorldNewsItem,
  portfolio: PortfolioHoldingResponse[],
  products: TradingInstrument[]
) {
  return affectedHoldings(news, portfolio, products).length > 0;
}

export function holdingImpactMetaForNews(
  news: WorldNewsItem,
  portfolio: PortfolioHoldingResponse[],
  products: TradingInstrument[]
) {
  const holdings = affectedHoldings(news, portfolio, products);
  if (holdings.length === 0) return null;

  const wasHeldAtEvent = holdings.some((holding) => holdingWasOpenAtNews(holding, news));
  return holdingImpactMeta(news.direction, wasHeldAtEvent ? "HELD_AT_EVENT" : "POST_EVENT_ENTRY");
}

export function newsImpactLabel(news: WorldNewsItem) {
  if (news.direction === "MIXED") {
    return `Market volatility - ${Math.abs(news.impactPercent).toFixed(1)}%`;
  }
  if (news.direction === "NEUTRAL") return "Neutral";
  return `${news.impactPercent > 0 ? "+" : ""}${news.impactPercent.toFixed(1)}%`;
}

export function personalHoldingImpactText(
  direction: NewsDirection,
  timing: HoldingImpactTiming = "HELD_AT_EVENT"
) {
  return holdingImpactMeta(direction, timing).hint;
}

export function holdingImpactMeta(
  direction: NewsDirection,
  timing: HoldingImpactTiming = "HELD_AT_EVENT"
): HoldingImpactMeta {
  if (timing === "POST_EVENT_ENTRY") {
    if (direction === "POSITIVE") {
      return {
        label: "BOUGHT AFTER RALLY",
        hint: "You entered this position after the price move.",
        tone: "mixed",
        timing
      };
    }

    if (direction === "NEGATIVE") {
      return {
        label: "BOUGHT THE DIP",
        hint: "You entered this position after the initial drop.",
        tone: "positive",
        timing
      };
    }

    if (direction === "NEUTRAL") {
      return {
        label: "RELATED POSITION",
        hint: "This older news is related to your current holdings.",
        tone: "neutral",
        timing
      };
    }

    return {
      label: "POST-EVENT ENTRY",
      hint: "You opened this position after this news was priced in.",
      tone: "neutral",
      timing
    };
  }

  if (direction === "POSITIVE") {
    return {
      label: "BENEFITS YOU",
      hint: "Your holdings may benefit from this event.",
      tone: "positive",
      timing
    };
  }

  if (direction === "NEGATIVE") {
    return {
      label: "HURTS YOU",
      hint: "Your holdings may be hit by this event.",
      tone: "negative",
      timing
    };
  }

  if (direction === "NEUTRAL") {
    return {
      label: "WATCH",
      hint: "This news is related to your holdings.",
      tone: "neutral",
      timing
    };
  }

  return {
    label: "AFFECTS YOU",
    hint: "Your holdings are exposed to market volatility.",
    tone: "mixed",
    timing
  };
}

export function holdingImpactClass(tone: HoldingImpactTone) {
  if (tone === "positive") return "border-emerald-400/70 bg-emerald-400/15 text-emerald-100";
  if (tone === "negative") return "border-red-400/70 bg-red-400/15 text-red-100";
  if (tone === "neutral") return "border-stone-500/70 bg-stone-500/15 text-stone-200";
  return "border-amber-400/70 bg-amber-400/15 text-amber-100";
}

export function holdingImpactCardClass(tone: HoldingImpactTone) {
  if (tone === "positive") return "border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.14)]";
  if (tone === "negative") return "border-red-500/70 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.14)]";
  if (tone === "neutral") return "border-stone-500/70 bg-stone-500/10 shadow-[0_0_0_1px_rgba(120,113,108,0.14)]";
  return "border-amber-500/70 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.14)]";
}
