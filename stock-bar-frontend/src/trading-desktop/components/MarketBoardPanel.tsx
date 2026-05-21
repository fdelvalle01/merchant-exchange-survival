import { changeFor, money, percentFor, signalFor, valueClass } from "../marketUtils";
import type { TradingInstrument } from "../types";

type MarketBoardPanelProps = {
  instruments: TradingInstrument[];
  selectedInstrumentId?: TradingInstrument["id"];
  onSelectInstrument: (instrument: TradingInstrument) => void;
  isActive: boolean;
};

export default function MarketBoardPanel({
  instruments,
  selectedInstrumentId,
  onSelectInstrument,
  isActive
}: MarketBoardPanelProps) {
  return (
    <section
      className={`min-h-[420px] overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.10), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Market Board
          </h2>
          <p className="text-[11px] text-stone-500">Ale instruments, live tavern exchange</p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          MB-01
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <table className="w-full min-w-[720px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-[#3b2a1f] text-left text-stone-500">
              <th className="py-2 pr-3 font-medium">Instrument</th>
              <th className="px-3 py-2 text-right font-medium">Last Price</th>
              <th className="px-3 py-2 text-right font-medium">Change</th>
              <th className="px-3 py-2 text-right font-medium">Change %</th>
              <th className="px-3 py-2 text-right font-medium">Peak</th>
              <th className="pl-3 py-2 text-right font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {instruments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-stone-500">
                  No hay productos cargados desde el backend.
                </td>
              </tr>
            )}
            {instruments.map((instrument) => {
              const change = changeFor(instrument);
              const percent = percentFor(instrument);
              const isSelected = String(selectedInstrumentId) === String(instrument.id);

              return (
                <tr
                  key={instrument.id}
                  onClick={() => onSelectInstrument(instrument)}
                  className={`cursor-pointer border-b border-[#241811] transition ${
                    isSelected
                      ? "bg-amber-500/10 outline outline-1 outline-amber-700/40"
                      : "hover:bg-[#20160f]"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? "bg-amber-300" : "bg-stone-600"
                        }`}
                      />
                      <span className="font-sans text-sm font-medium text-stone-100">
                        {instrument.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-stone-100">
                    {money.format(instrument.currentPrice)}
                  </td>
                  <td className={`px-3 py-3 text-right ${valueClass(change)}`}>
                    {change > 0 ? "+" : ""}
                    {money.format(change)}
                  </td>
                  <td className={`px-3 py-3 text-right ${valueClass(percent)}`}>
                    {percent > 0 ? "+" : ""}
                    {percent.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3 text-right text-stone-400">
                    {money.format(instrument.maxPrice ?? instrument.currentPrice)}
                  </td>
                  <td className={`pl-3 py-3 text-right ${valueClass(percent)}`}>
                    {signalFor(instrument)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
