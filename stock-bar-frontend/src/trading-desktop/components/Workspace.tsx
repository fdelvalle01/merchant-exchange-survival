import MarketBoardPanel from "./MarketBoardPanel";
import OrderTicketPanel from "./OrderTicketPanel";
import type { DesktopAppId, TradingInstrument } from "../types";

type WorkspaceProps = {
  activeApp: DesktopAppId;
  instruments: TradingInstrument[];
  selectedInstrument?: TradingInstrument;
  onSelectInstrument: (instrument: TradingInstrument) => void;
  onOrderSubmitted: () => void;
};

export default function Workspace({
  activeApp,
  instruments,
  selectedInstrument,
  onSelectInstrument,
  onOrderSubmitted
}: WorkspaceProps) {
  return (
    <main
      className="min-h-0 overflow-auto bg-[#070504] p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 16% 0%, rgba(132, 85, 38, 0.16), transparent 30%), radial-gradient(circle at 78% 22%, rgba(91, 76, 55, 0.14), transparent 28%), linear-gradient(180deg, #080604 0%, #050403 100%)"
      }}
    >
      <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <MarketBoardPanel
          instruments={instruments}
          selectedInstrumentId={selectedInstrument?.id}
          onSelectInstrument={onSelectInstrument}
          isActive={activeApp === "market"}
        />
        <OrderTicketPanel
          instruments={instruments}
          selectedInstrument={selectedInstrument}
          onSelectInstrument={onSelectInstrument}
          onOrderSubmitted={onOrderSubmitted}
          isActive={activeApp === "orders"}
        />
      </div>
    </main>
  );
}
