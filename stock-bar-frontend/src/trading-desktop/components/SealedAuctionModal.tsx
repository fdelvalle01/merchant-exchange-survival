import { useEffect, useRef, useState } from "react";
import { FaSkull } from "react-icons/fa";
import { money } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import {
  getAuction,
  selectAuctionCard,
  type AuctionSelectionResponse,
  type SealedAuctionResponse
} from "../services/relicsApi";
import RelicIcon from "./RelicIcon";

const roman = ["I", "II", "III", "IV"];

type Props = {
  auction: SealedAuctionResponse;
  onClose: () => void;
  onResolved: () => Promise<void> | void;
};

function resultFromAuction(auction: SealedAuctionResponse): AuctionSelectionResponse | null {
  if (
    auction.status !== "RESOLVED" ||
    auction.selectedCardPosition == null ||
    !auction.selectedOutcomePolarity ||
    !auction.selectedOutcomeCode ||
    !auction.selectedOutcomeTitle ||
    !auction.selectedOutcomeDescription
  ) {
    return null;
  }
  return {
    auctionId: auction.id,
    status: auction.status,
    selectedCardPosition: auction.selectedCardPosition,
    selectedOutcomePolarity: auction.selectedOutcomePolarity,
    selectedOutcomeCode: auction.selectedOutcomeCode,
    selectedOutcomeTitle: auction.selectedOutcomeTitle,
    selectedOutcomeDescription: auction.selectedOutcomeDescription,
    relic: auction.selectedRelic,
    cash: 0
  };
}

export default function SealedAuctionModal({ auction, onClose, onResolved }: Props) {
  const [detail, setDetail] = useState(auction);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    auction.selectedCardPosition ?? null
  );
  const [confirming, setConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justResolved, setJustResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLElement>(null);
  const [result, setResult] = useState<AuctionSelectionResponse | null>(
    resultFromAuction(auction)
  );

  useEffect(() => {
    getAuction(auction.id)
      .then((nextDetail) => {
        const restoredResult = resultFromAuction(nextDetail);
        setDetail(nextDetail);
        if (restoredResult) {
          setSelectedPosition(restoredResult.selectedCardPosition);
          setResult(restoredResult);
        }
      })
      .catch((requestError) => setError(normalizeApiError(requestError).message));
  }, [auction.id]);

  useEffect(() => {
    const handleModalKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleModalKeys);
    const initialFocus = window.setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
    }, 0);
    return () => {
      window.clearTimeout(initialFocus);
      window.removeEventListener("keydown", handleModalKeys);
    };
  }, [isSubmitting, onClose]);

  async function claim() {
    if (!selectedPosition) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const nextResult = await selectAuctionCard(detail.id, selectedPosition);
      setResult(nextResult);
      setJustResolved(true);
      setDetail((current) => ({
        ...current,
        status: "RESOLVED",
        selectedCardPosition: nextResult.selectedCardPosition,
        selectedOutcomePolarity: nextResult.selectedOutcomePolarity,
        selectedOutcomeCode: nextResult.selectedOutcomeCode,
        selectedOutcomeTitle: nextResult.selectedOutcomeTitle,
        selectedOutcomeDescription: nextResult.selectedOutcomeDescription,
        selectedRelic: nextResult.relic,
        cards: current.cards.map((card) => ({
          ...card,
          selected: card.position === nextResult.selectedCardPosition,
          revealed: card.position === nextResult.selectedCardPosition
        }))
      }));
      await onResolved();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
      setConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const outcomeClass = result
    ? `is-${result.selectedOutcomePolarity.toLowerCase()}`
    : "";

  return (
    <div className="mes-auction-overlay" role="presentation" onMouseDown={onClose}>
      <section
        ref={modalRef}
        className="mes-auction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sealed-auction-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mes-auction-modal__header">
          <div>
            <div className="mes-code-badge">ROYAL SEALED AUCTION</div>
            <h2 id="sealed-auction-title" className="mes-auction-modal__title">
              THE AUCTION OF FOUR FATES
            </h2>
            <p>One bid. One choice. The remaining lots are lost.</p>
          </div>
          <button type="button" className="mes-icon-button" onClick={onClose} aria-label="Close auction">
            X
          </button>
        </header>

        <div className="mes-auction-modal__terms">
          <span>ENTRY BID {money.format(detail.entryCost)}</span>
          <span>{detail.daysRemaining <= 0 ? "CLOSES END OF DAY" : `${detail.daysRemaining} DAY(S) LEFT`}</span>
        </div>

        <div className="mes-sealed-cards" aria-label="Four sealed lots">
          {detail.cards.map((card, index) => {
            const selected = selectedPosition === card.position;
            const revealed = (result?.selectedCardPosition ?? detail.selectedCardPosition) === card.position
              && detail.status === "RESOLVED";
            const lost = detail.status === "RESOLVED" && !revealed;
            return (
              <button
                key={card.position}
                type="button"
                disabled={lost || detail.status === "RESOLVED" || isSubmitting}
                aria-pressed={selected}
                className={`mes-sealed-card ${selected ? "is-selected" : ""} ${
                  revealed ? `is-revealed ${outcomeClass} ${justResolved ? "is-revealing" : ""}` : ""
                } ${lost ? "is-lost" : ""}`}
                onClick={() => {
                  setSelectedPosition(card.position);
                  setConfirming(false);
                }}
              >
                <span className="mes-sealed-card__lot">LOT {roman[index]}</span>
                <span className="mes-sealed-card__icon">
                  {revealed && result?.relic
                    ? <RelicIcon iconKey={result.relic.iconKey} />
                    : <FaSkull aria-hidden="true" />}
                </span>
                <span className="mes-sealed-card__mystery">
                  {revealed && result ? result.selectedOutcomeTitle : lost ? "LOST" : "????"}
                </span>
                {revealed && result && (
                  <span className="mes-sealed-card__description">
                    {result.selectedOutcomeDescription}
                  </span>
                )}
                <span className="mes-sealed-card__seal">
                  {revealed ? result?.selectedOutcomePolarity : lost ? "LOT LOST" : "SEALED"}
                </span>
              </button>
            );
          })}
        </div>

        {result && (
          <>
            <div className="mes-auction-lost-notice">THE REMAINING LOTS ARE LOST</div>
            <div className={`mes-auction-reveal ${outcomeClass}`} aria-live="polite">
              {result.relic
                ? <RelicIcon iconKey={result.relic.iconKey} />
                : <FaSkull aria-hidden="true" />}
              <div>
                <span className="mes-auction-reveal__polarity">{result.selectedOutcomePolarity}</span>
                <strong>{result.selectedOutcomeTitle}</strong>
                <p>{result.selectedOutcomeDescription}</p>
              </div>
            </div>
          </>
        )}
        {error && <div className="mes-banner mes-banner--danger" role="alert">{error}</div>}
        {confirming && !result && (
          <div className="mes-banner mes-banner--warning">
            Confirm Lot {roman[(selectedPosition ?? 1) - 1]}. The entry bid is charged once and cannot be undone.
          </div>
        )}

        <footer className="mes-auction-modal__actions">
          <button type="button" className="mes-button" onClick={onClose} disabled={isSubmitting}>
            {result ? "CONTINUE" : "LEAVE AUCTION"}
          </button>
          {!result && !confirming && (
            <button
              type="button"
              className="mes-button mes-button--primary"
              disabled={!selectedPosition || detail.status === "RESOLVED"}
              onClick={() => setConfirming(true)}
            >
              CLAIM SELECTED LOT
            </button>
          )}
          {!result && confirming && (
            <button
              type="button"
              className="mes-button mes-button--primary"
              disabled={isSubmitting}
              onClick={claim}
            >
              {isSubmitting ? "RESOLVING..." : "CONFIRM CLAIM"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
