import type { NewsDirection, PortfolioHoldingResponse, TradingInstrument, WorldNewsItem } from "./types";

export type HoldingImpactTone = "positive" | "negative" | "mixed" | "neutral";

export type HoldingImpactMeta = {
  label: string;
  toastMessage: string;
  tone: HoldingImpactTone;
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

export function newsAffectsHolding(
  news: WorldNewsItem,
  portfolio: PortfolioHoldingResponse[],
  products: TradingInstrument[]
) {
  const visibleHoldings = portfolio.filter((holding) => holding.quantity > 0);
  if (visibleHoldings.length === 0) return false;

  const affectedAssetName = normalize(news.affectedAssetName);
  if (
    affectedAssetName &&
    visibleHoldings.some((holding) => normalize(holding.assetName) === affectedAssetName)
  ) {
    return true;
  }

  const affectedSectors = sectorTokens(news.affectedSector);
  if (affectedSectors.length === 0) return false;
  if (affectedSectors.includes("GENERAL")) return true;

  const heldSectors = new Set(
    visibleHoldings
      .map((holding) => {
        const product = products.find((candidate) => Number(candidate.id) === holding.assetId);
        return normalize(product?.sector);
      })
      .filter(Boolean)
  );

  if (affectedSectors.includes("MIXED")) {
    return ["MINING", "BANKING", "ARCANE", "SHIPPING", "LOGISTICS", "GRAIN", "FOOD"].some(
      (sector) => heldSectors.has(sector)
    );
  }

  return affectedSectors.some((sector) => heldSectors.has(sector));
}

export function newsImpactLabel(news: WorldNewsItem) {
  if (news.direction === "MIXED") return `Mixed ${Math.abs(news.impactPercent).toFixed(1)}%`;
  if (news.direction === "NEUTRAL") return "Neutral";
  return `${news.impactPercent > 0 ? "+" : ""}${news.impactPercent.toFixed(1)}%`;
}

export function holdingImpactMeta(direction: NewsDirection): HoldingImpactMeta {
  if (direction === "POSITIVE") {
    return {
      label: "BENEFITS YOU",
      toastMessage: "Your holdings benefited from this news.",
      tone: "positive"
    };
  }

  if (direction === "NEGATIVE") {
    return {
      label: "HURTS YOU",
      toastMessage: "Your holdings were hit by this news.",
      tone: "negative"
    };
  }

  if (direction === "NEUTRAL") {
    return {
      label: "WATCH",
      toastMessage: "This news is related to your holdings.",
      tone: "neutral"
    };
  }

  return {
    label: "AFFECTS YOU",
    toastMessage: "This news may affect your holdings.",
    tone: "mixed"
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
