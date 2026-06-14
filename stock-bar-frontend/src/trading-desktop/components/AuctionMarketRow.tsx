import type { SealedAuctionResponse } from "../types";
import { FaSkull } from "react-icons/fa";
import RelicIcon from "./RelicIcon";

type Props = {
  auction: SealedAuctionResponse;
  onOpen: () => void;
};

export default function AuctionMarketRow({ auction, onOpen }: Props) {
  const isAvailable = auction.status === "AVAILABLE" || auction.status === "ENTERED";
  const isResolved = auction.status === "RESOLVED";
  const statusLabel = isResolved ? "CLAIMED" : auction.status === "EXPIRED" ? "EXPIRED" : (
    auction.daysRemaining <= 0 ? "CLOSES TODAY" : `${auction.daysRemaining}D LEFT`
  );

  if (!isAvailable) {
    return (
      <tr className="mes-auction-row is-settled">
        <td>
          <div className="mes-table__asset">
            <span className="mes-auction-row__icon" aria-hidden="true">
              {isResolved && auction.selectedRelic
                ? <RelicIcon iconKey={auction.selectedRelic.iconKey} />
                : <FaSkull />}
            </span>
            <span>
              <span className="mes-table__asset-name">ROYAL SEALED AUCTION</span>
              <span className="mes-auction-row__badge">{statusLabel}</span>
            </span>
          </div>
        </td>
        <td colSpan={5} className="mes-auction-row__result">
          {isResolved && auction.selectedOutcomeTitle
            ? `${auction.selectedOutcomeTitle} resolved - Clears next day`
            : "No lot was claimed - Clears next day"}
        </td>
        <td className="text-right mes-neutral">{statusLabel}</td>
      </tr>
    );
  }

  return (
    <tr
      className="mes-auction-row"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpen();
      }}
      title="One bid, one sealed choice"
    >
      <td>
        <div className="mes-table__asset">
          <span className="mes-auction-row__icon" aria-hidden="true">A</span>
          <span>
            <span className="mes-table__asset-name">ROYAL SEALED AUCTION</span>
            <span className="mes-auction-row__badge">{statusLabel}</span>
          </span>
        </div>
      </td>
      <td className="text-right mes-warning">????</td>
      <td className="text-right mes-warning">????</td>
      <td className="text-right mes-warning">????</td>
      <td className="text-right mes-neutral">SEALED</td>
      <td className="text-right mes-warning">{auction.status}</td>
      <td className="text-right">
        <button
          type="button"
          className="mes-button mes-button--compact"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          OPEN
        </button>
      </td>
    </tr>
  );
}
