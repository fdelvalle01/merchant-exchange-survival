import { useEffect, useState } from "react";
import { FaBalanceScale, FaClock, FaCrown, FaSkull } from "react-icons/fa";
import { money } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import {
  getAuction,
  selectAuctionCard,
  type AuctionSelectionResponse,
  type SealedAuctionResponse
} from "../services/relicsApi";
import RelicIcon from "./RelicIcon";

const cardIcons = [FaSkull, FaCrown, FaClock, FaBalanceScale];
const roman = ["I", "II", "III", "IV"];

type Props = {
  auction: SealedAuctionResponse;
  onClose: () => void;
  onResolved: () => Promise<void> | void;
};

export default function SealedAuctionModal({ auction, onClose, onResolved }: Props) {
  const [detail, setDetail] = useState(auction);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    auction.selectedCardPosition ?? null
  );
  const [confirming, setConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuctionSelectionResponse | null>(
    auction.selectedRelic && auction.selectedCardPosition
      ? {
          auctionId: auction.id,
          status: auction.status,
          selectedCardPosition: auction.selectedCardPosition,
          relic: auction.selectedRelic,
          cash: 0
        }
      : null
  );

  useEffect(() => {
    getAuction(auction.id)
      .then((nextDetail) => {
        setDetail(nextDetail);
        if (nextDetail.selectedRelic && nextDetail.selectedCardPosition) {
          setSelectedPosition(nextDetail.selectedCardPosition);
          setResult({
            auctionId: nextDetail.id,
            status: nextDetail.status,
            selectedCardPosition: nextDetail.selectedCardPosition,
            relic: nextDetail.selectedRelic,
            cash: 0
          });
        }
      })
      .catch((requestError) => setError(normalizeApiError(requestError).message));
  }, [auction.id]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  async function claim() {
    if (!selectedPosition) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const nextResult = await selectAuctionCard(detail.id, selectedPosition);
      setResult(nextResult);
      setDetail((current) => ({
        ...current,
        status: "RESOLVED",
        selectedCardPosition: nextResult.selectedCardPosition,
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

  return (
    <div className="mes-auction-overlay" role="presentation" onMouseDown={onClose}>
      <section
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
            const Icon = cardIcons[index];
            const selected = selectedPosition === card.position;
            const revealed = (result?.selectedCardPosition ?? detail.selectedCardPosition) === card.position
              && detail.status === "RESOLVED";
            return (
              <button
                key={card.position}
                type="button"
                disabled={detail.status === "RESOLVED" || isSubmitting}
                aria-pressed={selected}
                className={`mes-sealed-card ${selected ? "is-selected" : ""} ${revealed ? "is-revealed" : ""}`}
                onClick={() => {
                  setSelectedPosition(card.position);
                  setConfirming(false);
                }}
              >
                <span className="mes-sealed-card__lot">LOT {roman[index]}</span>
                <span className="mes-sealed-card__icon">
                  {revealed && result ? <RelicIcon iconKey={result.relic.iconKey} /> : <Icon aria-hidden="true" />}
                </span>
                <span className="mes-sealed-card__mystery">
                  {revealed && result ? result.relic.name : "????"}
                </span>
                <span className="mes-sealed-card__seal">{revealed ? "REVEALED" : "SEALED"}</span>
              </button>
            );
          })}
        </div>

        {result && (
          <div className="mes-auction-reveal" aria-live="polite">
            <RelicIcon iconKey={result.relic.iconKey} />
            <div>
              <strong>{result.relic.name}</strong>
              <p>{result.relic.description}</p>
            </div>
          </div>
        )}
        {error && <div className="mes-banner mes-banner--danger" role="alert">{error}</div>}
        {confirming && !result && (
          <div className="mes-banner mes-banner--warning">
            Confirm Lot {roman[(selectedPosition ?? 1) - 1]}. The entry bid is charged once and cannot be undone.
          </div>
        )}

        <footer className="mes-auction-modal__actions">
          <button type="button" className="mes-button" onClick={onClose} disabled={isSubmitting}>
            {result ? "SEND TO INVENTORY" : "LEAVE AUCTION"}
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
