import type { TradingInstrument } from "../types";
import { money, percentFor, trendFor } from "../marketUtils";

type TickerTapeProps = {
  instruments: TradingInstrument[];
};

export default function TickerTape({ instruments }: TickerTapeProps) {
  const tickerItems = [...instruments, ...instruments, ...instruments];

  return (
    <section className="h-10 shrink-0 overflow-hidden border-b border-[#3b2a1f] bg-[#060403]">
      <div className="sbx-ticker-track flex h-full w-max items-center gap-8 px-6 font-mono text-sm">
        {instruments.length === 0 && (
          <div className="flex h-full items-center whitespace-nowrap text-stone-500">
            Esperando activos del backend...
          </div>
        )}

        {tickerItems.map((instrument, index) => {
          const percent = percentFor(instrument);
          const trend = trendFor(instrument);
          const trendClass =
            trend === "up"
              ? "text-emerald-300"
              : trend === "down"
                ? "text-red-300"
                : "text-stone-300";

          return (
            <div
              key={`${instrument.id}-${index}`}
              className="flex h-full shrink-0 items-center gap-2 whitespace-nowrap"
            >
              <span className="text-amber-700">|</span>
              {instrument.imageUrl && (
                <img
                  src={instrument.imageUrl}
                  alt=""
                  className="h-6 w-6 rounded border border-[#4a3323] bg-black/30 object-cover"
                />
              )}
              <span className="text-stone-100">{instrument.name.toUpperCase()}</span>
              <span className={trendClass}>{money.format(instrument.currentPrice)}</span>
              <span className={trendClass}>
                {trend === "up" ? "+" : ""}
                {percent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
