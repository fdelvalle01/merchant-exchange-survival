import { useEffect, useMemo, useState } from "react";
import { normalizeApiError } from "../services/apiError";
import {
  activateRelic,
  equipRelic,
  unequipRelic,
  type RelicActivationResponse,
  type RelicResponse
} from "../services/relicsApi";
import type { TradingInstrument } from "../types";
import RelicIcon from "./RelicIcon";

type Props = {
  relics: RelicResponse[];
  products: TradingInstrument[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
  onCompanyChanged: () => Promise<void> | void;
};

function relicCounter(relic: RelicResponse) {
  if (relic.status === "ACTIVE") return `${relic.daysRemaining ?? 0}D`;
  if (relic.chargesRemaining != null) return `${relic.chargesRemaining}X`;
  return relic.status;
}

export default function ActiveRelicsBar({
  relics,
  products,
  canManage,
  onChanged,
  onCompanyChanged
}: Props) {
  const [selectedRelicId, setSelectedRelicId] = useState<number | null>(null);
  const [targetProductId, setTargetProductId] = useState<number | null>(null);
  const [activationResult, setActivationResult] = useState<RelicActivationResponse | null>(null);
  const [isConfirmingActivation, setIsConfirmingActivation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slotted = useMemo(
    () => new Map(relics.filter((relic) => relic.equippedSlot).map((relic) => [relic.equippedSlot, relic])),
    [relics]
  );
  const selectedRelic = relics.find((relic) => relic.id === selectedRelicId) ?? null;

  useEffect(() => {
    const openSlot = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!["1", "2", "3", "4"].includes(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea")) return;
      const relic = slotted.get(Number(event.key));
      if (relic) setSelectedRelicId(relic.id);
    };
    window.addEventListener("keydown", openSlot);
    return () => window.removeEventListener("keydown", openSlot);
  }, [slotted]);

  useEffect(() => {
    if (!isConfirmingActivation) return;
    const cancelConfirmation = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsConfirmingActivation(false);
    };
    window.addEventListener("keydown", cancelConfirmation);
    return () => window.removeEventListener("keydown", cancelConfirmation);
  }, [isConfirmingActivation]);

  async function moveRelic(relicId: number, slot: number) {
    if (!canManage) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await equipRelic(relicId, slot);
      await onChanged();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function activate() {
    if (!selectedRelic) return;
    setIsSubmitting(true);
    setError(null);
    setActivationResult(null);
    try {
      const result = await activateRelic(
        selectedRelic.id,
        selectedRelic.targetType === "PRODUCT" ? targetProductId ?? undefined : undefined
      );
      setActivationResult(result);
      setIsConfirmingActivation(false);
      await Promise.all([onChanged(), onCompanyChanged()]);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mes-relic-bar" aria-label="Active relics">
      <div className="mes-relic-bar__label">ACTIVE RELICS</div>
      <div className="mes-relic-slots">
        {[1, 2, 3, 4].map((slot) => {
          const relic = slotted.get(slot);
          return (
            <button
              key={slot}
              type="button"
              className={`mes-relic-slot ${relic ? "is-filled" : ""} ${relic?.status === "ACTIVE" ? "is-active" : ""}`}
              onClick={() => relic && setSelectedRelicId(relic.id)}
              onDragOver={(event) => canManage && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const relicId = Number(event.dataTransfer.getData("text/relic-id"));
                if (Number.isFinite(relicId)) moveRelic(relicId, slot);
              }}
              title={relic ? `${relic.name}: ${relic.description}` : `Empty relic slot ${slot}`}
            >
              <span className="mes-relic-slot__key">{slot}</span>
              <span className="mes-relic-slot__icon">
                {relic ? <RelicIcon iconKey={relic.iconKey} /> : <span>+</span>}
              </span>
              <span className="mes-relic-slot__count">{relic ? relicCounter(relic) : "EMPTY"}</span>
              {relic && (
                <span
                  draggable={canManage && relic.status !== "ACTIVE"}
                  onDragStart={(event) => event.dataTransfer.setData("text/relic-id", String(relic.id))}
                  className="mes-relic-slot__drag"
                />
              )}
            </button>
          );
        })}
      </div>
      {error && <div className="mes-relic-bar__error" role="alert">{error}</div>}

      {selectedRelic && (
        <div className="mes-relic-popover">
          <button
            type="button"
            className="mes-relic-popover__close"
            onClick={() => {
              setSelectedRelicId(null);
              setActivationResult(null);
              setIsConfirmingActivation(false);
              setError(null);
            }}
            aria-label="Close relic detail"
          >
            X
          </button>
          <div className="mes-relic-popover__title">
            <RelicIcon iconKey={selectedRelic.iconKey} />
            <strong>{selectedRelic.name}</strong>
          </div>
          <p>{selectedRelic.description}</p>
          <div className="mes-relic-popover__meta">
            <span>{selectedRelic.status}</span>
            {selectedRelic.status === "ACTIVE" && (
              <span>Bankruptcy Protection: {selectedRelic.daysRemaining ?? 0} days remaining</span>
            )}
            {selectedRelic.chargesRemaining != null && (
              <span>{selectedRelic.chargesRemaining} charge(s)</span>
            )}
          </div>
          {selectedRelic.targetType === "PRODUCT" && selectedRelic.status === "EQUIPPED" && (
            <select
              className="mes-select"
              value={targetProductId ?? ""}
              onChange={(event) => setTargetProductId(Number(event.target.value) || null)}
            >
              <option value="">Select Market Board asset</option>
              {products.map((product) => (
                <option key={product.id} value={Number(product.id)}>
                  {product.name}
                </option>
              ))}
            </select>
          )}
          {activationResult?.forecast && (
            <div className="mes-omen-result" aria-live="polite">
              <strong>{activationResult.targetProductName} | Confidence {activationResult.confidence}</strong>
              {activationResult.forecast.map((day) => (
                <span key={day.dayOffset}>Day +{day.dayOffset}: {day.outlook}</span>
              ))}
            </div>
          )}
          {isConfirmingActivation && (
            <div
              className="mes-relic-confirmation"
              role="alertdialog"
              aria-labelledby="relic-confirmation-title"
              aria-describedby="relic-confirmation-copy"
            >
              <span className="mes-relic-confirmation__eyebrow">CONFIRM RELIC USE</span>
              <strong id="relic-confirmation-title">{selectedRelic.name}</strong>
              <p id="relic-confirmation-copy">
                {selectedRelic.targetType === "PRODUCT"
                  ? `Consume one charge to reveal the three-day outlook for ${
                      products.find((product) => Number(product.id) === targetProductId)?.name ?? "the selected asset"
                    }.`
                  : selectedRelic.code === "FORTUNE_DRAUGHT"
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
                  onClick={() => setIsConfirmingActivation(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
          <div className="mes-relic-popover__actions">
            {selectedRelic.status === "EQUIPPED" && canManage && !isConfirmingActivation && (
              <button
                type="button"
                className="mes-button mes-button--primary"
                disabled={isSubmitting || (selectedRelic.targetType === "PRODUCT" && !targetProductId)}
                onClick={() => {
                  setActivationResult(null);
                  setError(null);
                  setIsConfirmingActivation(true);
                }}
              >
                USE
              </button>
            )}
            {selectedRelic.status === "EQUIPPED" && canManage && !isConfirmingActivation && (
              <button
                type="button"
                className="mes-button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await unequipRelic(selectedRelic.id);
                    setSelectedRelicId(null);
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
        </div>
      )}
    </section>
  );
}
