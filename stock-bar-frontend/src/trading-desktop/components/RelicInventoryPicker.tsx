import { useState } from "react";
import { normalizeApiError } from "../services/apiError";
import { equipRelic, type RelicResponse } from "../services/relicsApi";
import { useAnchoredPopover } from "../hooks/useAnchoredPopover";
import RelicIcon from "./RelicIcon";

type Props = {
  anchor: HTMLElement | null;
  targetSlot: number;
  relics: RelicResponse[];
  canManage: boolean;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => Promise<void> | void;
  onEquipped: (slot: number) => Promise<void> | void;
  onClose: () => void;
};

function availability(relic: RelicResponse) {
  if (relic.status === "ACTIVE") return "ACTIVE";
  if (relic.status === "EQUIPPED") return `EQUIPPED IN SLOT ${relic.equippedSlot}`;
  if (relic.chargesRemaining != null) return `${relic.chargesRemaining} charge(s)`;
  if (relic.durationDays != null) return `${relic.durationDays} days`;
  return relic.status;
}

export default function RelicInventoryPicker({
  anchor,
  targetSlot,
  relics,
  canManage,
  isLoading,
  loadError,
  onRetry,
  onEquipped,
  onClose
}: Props) {
  const { popoverRef, style } = useAnchoredPopover(anchor, onClose);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const visibleRelics = relics.filter(
    (relic) => relic.status !== "CONSUMED" && relic.status !== "EXPIRED"
  );

  async function equip(relic: RelicResponse) {
    if (!canManage || relic.status !== "IN_INVENTORY") return;
    setSubmittingId(relic.id);
    setActionError(null);
    try {
      await equipRelic(relic.id, targetSlot);
      await onEquipped(targetSlot);
    } catch (error) {
      setActionError(normalizeApiError(error).message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div
      ref={popoverRef}
      style={style}
      className="mes-relic-popover mes-relic-picker"
      role="dialog"
      aria-label={`Relic inventory for slot ${targetSlot}`}
    >
      <button
        type="button"
        className="mes-relic-popover__close"
        onClick={onClose}
        aria-label="Close relic inventory"
      >
        X
      </button>
      <div className="mes-relic-popover__heading">
        <span>RELIC INVENTORY</span>
        <strong>SLOT {targetSlot}</strong>
      </div>

      {isLoading && <div className="mes-banner">Loading relic inventory...</div>}
      {loadError && (
        <div className="mes-banner mes-banner--danger" role="alert">
          <span>{loadError}</span>
          <button type="button" className="mes-button mes-button--compact" onClick={onRetry}>
            RETRY
          </button>
        </div>
      )}
      {actionError && <div className="mes-banner mes-banner--danger" role="alert">{actionError}</div>}

      {!isLoading && !loadError && visibleRelics.length === 0 && (
        <div className="mes-relic-picker__empty">
          <strong>NO RELICS AVAILABLE</strong>
          <span>Win a sealed auction to obtain a relic.</span>
        </div>
      )}

      <div className="mes-relic-picker__list">
        {visibleRelics.map((relic) => {
          const canEquip = canManage && relic.status === "IN_INVENTORY";
          return (
            <article
              key={relic.id}
              className="mes-relic-picker__item"
              draggable={canEquip}
              onDragStart={(event) => event.dataTransfer.setData("text/relic-id", String(relic.id))}
            >
              <span className="mes-relic-picker__icon"><RelicIcon iconKey={relic.iconKey} /></span>
              <span className="mes-relic-picker__copy">
                <strong>{relic.name}</strong>
                <span>{availability(relic)}</span>
              </span>
              <button
                type="button"
                className="mes-button mes-button--compact"
                disabled={!canEquip || submittingId !== null}
                title={!canManage ? "Your role cannot equip relics" : relic.status !== "IN_INVENTORY" ? "Relic is already equipped or active" : `Equip in slot ${targetSlot}`}
                onClick={() => equip(relic)}
              >
                {submittingId === relic.id ? "EQUIPPING..." : "EQUIP"}
              </button>
            </article>
          );
        })}
      </div>
      <p className="mes-relic-picker__help">Drag a relic into a slot or select EQUIP.</p>
    </div>
  );
}
