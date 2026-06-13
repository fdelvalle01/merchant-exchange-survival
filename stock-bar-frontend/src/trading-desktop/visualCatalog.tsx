import type { IconType } from "react-icons";
import {
  FaAnchor,
  FaBalanceScale,
  FaBeer,
  FaBullhorn,
  FaCoins,
  FaFortAwesome,
  FaFlask,
  FaHammer,
  FaKey,
  FaLeaf,
  FaSearch,
  FaScroll,
  FaTruck,
  FaUniversity,
  FaUserShield,
  FaWallet
} from "react-icons/fa";
import type { DesktopAppId } from "./types";

type AssetVisual = {
  icon: IconType;
  tone: string;
};

const assetVisuals: Array<{ matches: string[]; visual: AssetVisual }> = [
  {
    matches: ["silvercrown bank", "bank", "banking", "finance"],
    visual: { icon: FaUniversity, tone: "bank" }
  },
  {
    matches: ["black harbor shipping", "harbor", "shipping", "port"],
    visual: { icon: FaAnchor, tone: "shipping" }
  },
  {
    matches: ["old dragon brewery", "brewery", "ale", "beverage"],
    visual: { icon: FaBeer, tone: "brewery" }
  },
  {
    matches: ["ironhill mines", "mine", "mining", "metal"],
    visual: { icon: FaHammer, tone: "mining" }
  },
  {
    matches: ["northern logistics", "logistics", "transport"],
    visual: { icon: FaTruck, tone: "logistics" }
  },
  {
    matches: ["arcane research guild", "arcane", "research", "magic"],
    visual: { icon: FaFlask, tone: "arcane" }
  },
  {
    matches: ["royal grain company", "grain", "agriculture", "harvest"],
    visual: { icon: FaLeaf, tone: "grain" }
  }
];

const defaultAssetVisual: AssetVisual = {
  icon: FaCoins,
  tone: "default"
};

export const desktopAppIcons: Record<DesktopAppId, IconType> = {
  company: FaFortAwesome,
  market: FaBalanceScale,
  ticket: FaScroll,
  detail: FaSearch,
  portfolio: FaWallet,
  orders: FaKey,
  herald: FaBullhorn,
  admin: FaUserShield
};

export function getAssetVisual(name?: string, sector?: string): AssetVisual {
  const searchable = `${name ?? ""} ${sector ?? ""}`.toLowerCase();
  return (
    assetVisuals.find(({ matches }) =>
      matches.some((candidate) => searchable.includes(candidate))
    )?.visual ?? defaultAssetVisual
  );
}

export function AssetIcon({
  name,
  sector,
  className = ""
}: {
  name?: string;
  sector?: string;
  className?: string;
}) {
  const visual = getAssetVisual(name, sector);
  const Icon = visual.icon;

  return (
    <span
      className={`mes-asset-icon mes-asset-icon--${visual.tone} ${className}`.trim()}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
