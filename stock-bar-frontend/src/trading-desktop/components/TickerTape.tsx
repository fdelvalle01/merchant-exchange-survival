import { money, percentFor, trendFor } from "../marketUtils";
import type { TradingInstrument } from "../types";
import { AssetIcon } from "../visualCatalog";

type TickerTapeProps = {
  instruments: TradingInstrument[];
};

export default function TickerTape({ instruments }: TickerTapeProps) {
  function renderItems(copy: "primary" | "duplicate") {
    return instruments.map((instrument) => {
      const percent = percentFor(instrument);
      const trend = trendFor(instrument);
      const trendClass =
        trend === "up"
          ? "mes-positive"
          : trend === "down"
            ? "mes-negative"
            : "mes-neutral";

      return (
        <div key={`${copy}-${instrument.id}`} className="mes-ticker__item">
          <AssetIcon
            name={instrument.name}
            sector={instrument.sector}
            className="mes-asset-icon--ticker"
          />
          <span className="mes-ticker__name">{instrument.name.toUpperCase()}</span>
          <span className="mes-ticker__price">{money.format(instrument.currentPrice)}</span>
          <span className={`mes-ticker__change ${trendClass}`}>
            {trend === "up" ? "\u25B2 " : trend === "down" ? "\u25BC " : ""}
            {Math.abs(percent).toFixed(2)}%
          </span>
        </div>
      );
    });
  }

  return (
    <section className="mes-ticker" aria-label="Live market ticker">
      {instruments.length === 0 ? (
        <div className="mes-ticker__empty">Waiting for real market assets...</div>
      ) : (
        <div className="mes-ticker__track">
          <div className="mes-ticker__group">{renderItems("primary")}</div>
          <div className="mes-ticker__group" aria-hidden="true">
            {renderItems("duplicate")}
          </div>
        </div>
      )}
    </section>
  );
}
