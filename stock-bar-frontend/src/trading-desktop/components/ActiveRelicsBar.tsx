import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeApiError } from "../services/apiError";
import { equipRelic, type RelicResponse } from "../services/relicsApi";
import type { TradingInstrument } from "../types";
import RelicDetailPopover from "./RelicDetailPopover";
import RelicIcon from "./RelicIcon";
import RelicInventoryPicker from "./RelicInventoryPicker";

type Props = {
  relics: RelicResponse[];
  products: TradingInstrument[];
  canManage: boolean;
  isLoading: boolean;
  loadError: string | null;
  onChanged: () => Promise<void> | void;
  onCompanyChanged: () => Promise<void> | void;
};

type OpenPopover =
  | { kind: "picker"; slot: number }
  | { kind: "detail"; slot: number }
  | null;

function relicCounter(relic: RelicResponse) {
  if (relic.status === "ACTIVE") return `${relic.daysRemaining ?? 0}D`;
  if (relic.chargesRemaining != null) return `${relic.chargesRemaining}X`;
  if (relic.durationDays != null) return `${relic.durationDays}D`;
  return "";
}

export default function ActiveRelicsBar({
  relics,
  products,
  canManage,
  isLoading,
  loadError,
  onChanged,
  onCompanyChanged
}: Props) {
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentlyEquippedSlot, setRecentlyEquippedSlot] = useState<number | null>(null);
  const slotRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const slotted = useMemo(
    () => new Map(relics.filter((relic) => relic.equippedSlot).map((relic) => [relic.equippedSlot!, relic])),
    [relics]
  );

  const closePopover = useCallback(() => {
    const slot = openPopover?.slot;
    setOpenPopover(null);
    if (slot) {
      window.setTimeout(() => slotRefs.current[slot]?.focus(), 0);
    }
  }, [openPopover?.slot]);

  const openSlot = useCallback((slot: number) => {
    setError(null);
    setOpenPopover(slotted.has(slot) ? { kind: "detail", slot } : { kind: "picker", slot });
  }, [slotted]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!["1", "2", "3", "4"].includes(event.key)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement
        && target.matches("input, select, textarea, [contenteditable='true']")
      ) return;
      event.preventDefault();
      openSlot(Number(event.key));
    };
    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [openSlot]);

  useEffect(() => {
    if (!openPopover || openPopover.kind !== "detail") return;
    if (!slotted.has(openPopover.slot)) closePopover();
  }, [closePopover, openPopover, slotted]);

  useEffect(() => {
    if (recentlyEquippedSlot == null) return;
    const timeout = window.setTimeout(() => setRecentlyEquippedSlot(null), 650);
    return () => window.clearTimeout(timeout);
  }, [recentlyEquippedSlot]);

  async function moveRelic(relicId: number, slot: number) {
    if (!canManage || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await equipRelic(relicId, slot);
      await onChanged();
      setRecentlyEquippedSlot(slot);
      setOpenPopover({ kind: "detail", slot });
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
          const status = relic?.status === "ACTIVE" ? "ACTIVE" : relic ? "EQUIPPED" : "EMPTY";
          const label = relic
            ? `Slot ${slot}, ${relic.name}, ${status}, ${relicCounter(relic)}`
            : `Empty relic slot ${slot}. Open relic inventory.`;

          return (
            <button
              key={slot}
              ref={(element) => {
                slotRefs.current[slot] = element;
              }}
              type="button"
              draggable={canManage && Boolean(relic) && relic?.status !== "ACTIVE"}
              className={`mes-relic-slot ${relic ? "is-filled" : ""} ${
                relic?.status === "ACTIVE" ? "is-active" : ""
              } ${recentlyEquippedSlot === slot ? "is-equipped-pulse" : ""}`}
              onClick={() => openSlot(slot)}
              onDragStart={(event) => {
                if (relic) event.dataTransfer.setData("text/relic-id", String(relic.id));
              }}
              onDragOver={(event) => canManage && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const relicId = Number(event.dataTransfer.getData("text/relic-id"));
                if (Number.isFinite(relicId)) moveRelic(relicId, slot);
              }}
              title={label}
              aria-label={label}
              aria-expanded={openPopover?.slot === slot}
            >
              <span className="mes-relic-slot__key">{slot}</span>
              <span className="mes-relic-slot__icon">
                {relic ? <RelicIcon iconKey={relic.iconKey} /> : <span>+</span>}
              </span>
              <span className="mes-relic-slot__status">{status}</span>
              {relic && relicCounter(relic) && (
                <span className="mes-relic-slot__count">{relicCounter(relic)}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && <div className="mes-relic-bar__error" role="alert">{error}</div>}

      {openPopover?.kind === "picker" && (
        <RelicInventoryPicker
          anchor={slotRefs.current[openPopover.slot]}
          targetSlot={openPopover.slot}
          relics={relics}
          canManage={canManage}
          isLoading={isLoading}
          loadError={loadError}
          onRetry={onChanged}
          onEquipped={async (slot) => {
            await onChanged();
            setRecentlyEquippedSlot(slot);
            setOpenPopover({ kind: "detail", slot });
          }}
          onClose={closePopover}
        />
      )}

      {openPopover?.kind === "detail" && slotted.get(openPopover.slot) && (
        <RelicDetailPopover
          anchor={slotRefs.current[openPopover.slot]}
          relic={slotted.get(openPopover.slot)!}
          products={products}
          canManage={canManage}
          onChanged={onChanged}
          onCompanyChanged={onCompanyChanged}
          onClose={closePopover}
        />
      )}
    </section>
  );
}
