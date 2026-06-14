import { useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import { equipRelic, unequipRelic, type RelicResponse } from "../services/relicsApi";
import type { DesktopAppRenderProps } from "../types";
import { AssetIcon } from "../visualCatalog";
import RelicIcon from "../components/RelicIcon";

function RelicCard({
  relic,
  canManage,
  onChanged
}: {
  relic: RelicResponse;
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function equip(slot: number) {
    setIsSubmitting(true);
    setError(null);
    try {
      await equipRelic(relic.id, slot);
      await onChanged();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article
      className="mes-inventory-card"
      draggable={canManage && relic.status !== "CONSUMED" && relic.status !== "EXPIRED"}
      onDragStart={(event) => event.dataTransfer.setData("text/relic-id", String(relic.id))}
    >
      <div className="mes-inventory-card__icon"><RelicIcon iconKey={relic.iconKey} /></div>
      <div className="mes-inventory-card__body">
        <div className="mes-inventory-card__title">
          <strong>{relic.name}</strong>
          <span>{relic.status}</span>
        </div>
        <p>{relic.description}</p>
        <div className="mes-inventory-card__meta">
          <span>{relic.category}</span>
          <span>Target {relic.targetType}</span>
          {relic.durationDays != null && <span>{relic.durationDays} day duration</span>}
          {relic.chargesRemaining != null && <span>{relic.chargesRemaining} charge(s)</span>}
          {relic.equippedSlot && <span>Slot {relic.equippedSlot}</span>}
          <span>{relic.sourceAuctionId ? `Auction #${relic.sourceAuctionId}` : "Game Master grant"}</span>
        </div>
        {error && <div className="mes-negative">{error}</div>}
        {canManage && relic.status !== "CONSUMED" && relic.status !== "EXPIRED" && (
          <div className="mes-inventory-card__actions">
            {[1, 2, 3, 4].map((slot) => (
              <button
                key={slot}
                type="button"
                className="mes-button mes-button--compact"
                disabled={isSubmitting || relic.status === "ACTIVE" || relic.equippedSlot === slot}
                onClick={() => equip(slot)}
              >
                SLOT {slot}
              </button>
            ))}
            {relic.status === "EQUIPPED" && (
              <button
                type="button"
                className="mes-button mes-button--compact"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await unequipRelic(relic.id);
                    await onChanged();
                  } catch (requestError) {
                    setError(normalizeApiError(requestError).message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                UNEQUIP
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function PortfolioApp({
  currentUser,
  portfolio,
  products,
  selectedProduct,
  onSelectProduct,
  isLoadingPortfolio,
  portfolioError,
  onPortfolioChanged,
  isActive,
  relics,
  isLoadingRelics,
  relicsError,
  onGameItemsChanged
}: DesktopAppRenderProps) {
  const [tab, setTab] = useState<"HOLDINGS" | "INVENTORY">("HOLDINGS");
  const visiblePortfolio = portfolio.filter((holding) => holding.quantity > 0);
  const marketValue = visiblePortfolio.reduce((total, holding) => total + holding.marketValue, 0);
  const totalPnl = visiblePortfolio.reduce((total, holding) => total + holding.unrealizedPnl, 0);
  const productForHolding = (assetId: number) =>
    products.find((product) => String(product.id) === String(assetId));
  const canManage = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">Vault</h2>
          <p className="mes-app__subtitle">
            {tab === "HOLDINGS"
              ? `Value ${money.format(marketValue)} | P/L ${money.format(totalPnl)}`
              : `${relics.length} relic(s) secured`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => Promise.all([onPortfolioChanged(), onGameItemsChanged()])}
          className="mes-icon-button"
          title="Refresh vault"
          aria-label="Refresh vault"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="mes-app__body">
        <div className="mes-vault-tabs" role="tablist">
          {(["HOLDINGS", "INVENTORY"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={`mes-filter ${tab === value ? "is-active" : ""}`}
              onClick={() => setTab(value)}
            >
              {value}
            </button>
          ))}
        </div>

        {tab === "HOLDINGS" && (
          <>
            {isLoadingPortfolio && <div className="mes-banner">Loading portfolio...</div>}
            {portfolioError && <div className="mes-banner mes-banner--danger">{portfolioError}</div>}
            <div className="mes-app-table-wrap">
              <table className="mes-table min-w-[780px] table-fixed">
                <thead>
                  <tr>
                    <th className="w-[23%] text-left">Asset</th>
                    <th className="w-[9%] text-right">Qty</th>
                    <th className="w-[14%] text-right">Average</th>
                    <th className="w-[14%] text-right">Market</th>
                    <th className="w-[15%] text-right">Value</th>
                    <th className="w-[12%] text-right">Unrealized</th>
                    <th className="w-[8%] text-right">P/L %</th>
                    <th className="w-[5%] text-right">Alloc.</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoadingPortfolio && visiblePortfolio.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center mes-neutral">The vault contains no holdings.</td>
                    </tr>
                  )}
                  {visiblePortfolio.map((holding) => {
                    const product = productForHolding(holding.assetId);
                    const isSelected = String(selectedProduct?.id) === String(holding.assetId);
                    return (
                      <tr
                        key={holding.assetId}
                        onClick={() => product && onSelectProduct(product)}
                        onKeyDown={(event) => {
                          if (!product || (event.key !== "Enter" && event.key !== " ")) return;
                          event.preventDefault();
                          onSelectProduct(product);
                        }}
                        tabIndex={product ? 0 : undefined}
                        className={`${isSelected ? "is-selected" : ""} ${product ? "cursor-pointer" : "opacity-60"}`}
                      >
                        <td>
                          <div className="mes-table__asset">
                            <AssetIcon name={holding.assetName} sector={product?.sector} />
                            <span className="mes-table__asset-name">{holding.assetName}</span>
                          </div>
                        </td>
                        <td className="text-right">{holding.quantity}</td>
                        <td className="text-right mes-neutral">{money.format(holding.averagePrice)}</td>
                        <td className="text-right">{money.format(holding.currentPrice)}</td>
                        <td className="text-right">{money.format(holding.marketValue)}</td>
                        <td className={`text-right ${valueClass(holding.unrealizedPnl)}`}>{money.format(holding.unrealizedPnl)}</td>
                        <td className={`text-right ${valueClass(holding.unrealizedPnlPercent)}`}>
                          {holding.unrealizedPnlPercent > 0 ? "+" : ""}{holding.unrealizedPnlPercent.toFixed(2)}%
                        </td>
                        <td className="text-right mes-warning">
                          {marketValue > 0 ? `${((holding.marketValue / marketValue) * 100).toFixed(0)}%` : "0%"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "INVENTORY" && (
          <div
            className="mes-inventory"
            onDragOver={(event) => canManage && event.preventDefault()}
            onDrop={async (event) => {
              event.preventDefault();
              const relicId = Number(event.dataTransfer.getData("text/relic-id"));
              if (!Number.isFinite(relicId)) return;
              try {
                await unequipRelic(relicId);
                await onGameItemsChanged();
              } catch {
                // The source card keeps its backend state; per-card actions surface detailed errors.
              }
            }}
          >
            {isLoadingRelics && <div className="mes-banner">Loading relic inventory...</div>}
            {relicsError && <div className="mes-banner mes-banner--danger">{relicsError}</div>}
            {!isLoadingRelics && !relicsError && relics.length === 0 && (
              <div className="mes-state">
                <div>
                  <h3 className="mes-state__title">No relics acquired.</h3>
                  <p className="mes-state__copy">Win a sealed auction to obtain your first relic.</p>
                </div>
              </div>
            )}
            <div className="mes-inventory-grid">
              {relics.map((relic) => (
                <RelicCard
                  key={relic.id}
                  relic={relic}
                  canManage={canManage}
                  onChanged={onGameItemsChanged}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
