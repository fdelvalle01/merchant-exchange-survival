import { useEffect, useState } from "react";
import { useAnchoredPopover } from "../hooks/useAnchoredPopover";
import { normalizeApiError } from "../services/apiError";
import {
  activateRelic,
  unequipRelic,
  type RelicActivationResponse,
  type RelicResponse
} from "../services/relicsApi";
import type { TradingInstrument } from "../types";
import RelicIcon from "./RelicIcon";

type Props = {
  anchor: HTMLElement | null;
  relic: RelicResponse;
  products: TradingInstrument[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
  onCompanyChanged: () => Promise<void> | void;
  onClose: () => void;
};

export default function RelicDetailPopover({
  anchor,
  relic,
  products,
  canManage,
  onChanged,
  onCompanyChanged,
  onClose
}: Props) {
  const { popoverRef, style } = useAnchoredPopover(anchor, onClose);
  const [targetProductId, setTargetProductId] = useState<number | null>(null);
  const [activationResult, setActivationResult] = useState<RelicActivationResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetProductId(relic.targetProductId ?? null);
    setActivationResult(null);
    setIsConfirming(false);
    setError(null);
  }, [relic.id]);

  async function activate() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await activateRelic(
        relic.id,
        relic.targetType === "PRODUCT" ? targetProductId ?? undefined : undefined
      );
      setActivationResult(result);
      setIsConfirming(false);
      await Promise.all([onChanged(), onCompanyChanged()]);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function unequip() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await unequipRelic(relic.id);
      await onChanged();
      onClose();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const requiresTarget = relic.targetType === "PRODUCT";
  const canUse = relic.status === "EQUIPPED" && (!requiresTarget || targetProductId != null);

  return (
    <div
      ref={popoverRef}
      style={style}
      className="mes-relic-popover"
      role="dialog"
      aria-label={`${relic.name} detail`}
    >
      <button
        type="button"
        className="mes-relic-popover__close"
        onClick={onClose}
        aria-label="Close relic detail"
      >
        X
      </button>
      <div className="mes-relic-popover__title">
        <RelicIcon iconKey={relic.iconKey} />
        <strong>{relic.name}</strong>
      </div>
      <p>{relic.description}</p>
      <div className="mes-relic-popover__meta">
        <span>State: {relic.status}</span>
        {relic.status === "ACTIVE" && <span>Protection: {relic.daysRemaining ?? 0} days remaining</span>}
        {relic.chargesRemaining != null && <span>Charges: {relic.chargesRemaining}</span>}
      </div>

      {requiresTarget && relic.status === "EQUIPPED" && (
        <label className="mes-relic-target">
          <span>Target asset</span>
          <select
            className="mes-select"
            value={targetProductId ?? ""}
            onChange={(event) => setTargetProductId(Number(event.target.value) || null)}
          >
            <option value="">Select Market Board asset</option>
            {products.map((product) => (
              <option key={product.id} value={Number(product.id)}>{product.name}</option>
            ))}
          </select>
        </label>
      )}

      {activationResult?.forecast && (
        <div className="mes-omen-result" aria-live="polite">
          <strong>{activationResult.targetProductName} | Confidence {activationResult.confidence}</strong>
          {activationResult.forecast.map((day) => (
            <span key={day.dayOffset}>Day +{day.dayOffset}: {day.outlook}</span>
          ))}
        </div>
      )}
      {error && <div className="mes-banner mes-banner--danger" role="alert">{error}</div>}

      {isConfirming && (
        <div
          className="mes-relic-confirmation"
          role="alertdialog"
          aria-labelledby="relic-confirmation-title"
        >
          <span className="mes-relic-confirmation__eyebrow">CONFIRM RELIC USE</span>
          <strong id="relic-confirmation-title">{relic.name}</strong>
          <p>
            {requiresTarget
              ? `Consume one charge to reveal the three-day outlook for ${
                  products.find((product) => Number(product.id) === targetProductId)?.name ?? "the selected asset"
                }.`
              : relic.code === "FORTUNE_DRAUGHT"
                ? "Consume this relic to restore the company treasury. This action cannot be undone."
                : "Activate this relic for the company. Its duration begins immediately."}
          </p>
          <div className="mes-relic-confirmation__actions">
            <button
              type="button"
              className="mes-button mes-button--primary"
              disabled={isSubmitting}
              onClick={activate}
              autoFocus
            >
              {isSubmitting ? "ACTIVATING..." : "CONFIRM USE"}
            </button>
            <button
              type="button"
              className="mes-button"
              disabled={isSubmitting}
              onClick={() => setIsConfirming(false)}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="mes-relic-popover__actions">
        {relic.status === "EQUIPPED" && canManage && !isConfirming && (
          <button
            type="button"
            className="mes-button mes-button--primary"
            disabled={isSubmitting || !canUse}
            title={!canUse && requiresTarget ? "Select an asset before using this relic" : "Use relic"}
            onClick={() => setIsConfirming(true)}
          >
            USE
          </button>
        )}
        {relic.status === "EQUIPPED" && canManage && !isConfirming && (
          <button type="button" className="mes-button" disabled={isSubmitting} onClick={unequip}>
            UNEQUIP
          </button>
        )}
      </div>
    </div>
  );
}
