import { FaSyncAlt } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import type { DesktopAppRenderProps } from "../types";

export default function PortfolioApp({
  portfolio,
  products,
  selectedProduct,
  onSelectProduct,
  isLoadingPortfolio,
  portfolioError,
  onPortfolioChanged,
  isActive
}: DesktopAppRenderProps) {
  const visiblePortfolio = portfolio.filter((holding) => holding.quantity > 0);
  const marketValue = visiblePortfolio.reduce((total, holding) => total + holding.marketValue, 0);
  const totalPnl = visiblePortfolio.reduce((total, holding) => total + holding.unrealizedPnl, 0);
  const productForHolding = (assetId: number) =>
    products.find((product) => String(product.id) === String(assetId));

  return (
    <section
      className={`min-h-full overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
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
            Portfolio
          </h2>
          <p className="text-[11px] text-stone-500">
            Value {money.format(marketValue)} | P/L {money.format(totalPnl)}
          </p>
        </div>
        <button
          type="button"
          onClick={onPortfolioChanged}
          className="grid h-7 w-7 place-items-center rounded border border-amber-700/40 bg-black/30 text-amber-300 transition hover:bg-amber-500/10"
          title="Refresh portfolio"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 p-3">
        {isLoadingPortfolio && (
          <div className="rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 text-xs text-stone-500">
            Loading portfolio...
          </div>
        )}
        {portfolioError && (
          <div className="rounded border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {portfolioError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-[#3b2a1f] text-left text-stone-500">
                <th className="w-[25%] py-2 pr-2 font-medium">Asset</th>
                <th className="w-[10%] px-2 py-2 text-right font-medium">Qty</th>
                <th className="w-[15%] px-2 py-2 text-right font-medium">Avg</th>
                <th className="w-[15%] px-2 py-2 text-right font-medium">Last</th>
                <th className="w-[15%] px-2 py-2 text-right font-medium">Value</th>
                <th className="w-[11%] px-2 py-2 text-right font-medium">P/L</th>
                <th className="w-[9%] pl-2 py-2 text-right font-medium">P/L %</th>
              </tr>
            </thead>
            <tbody>
              {!isLoadingPortfolio && visiblePortfolio.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-stone-500">
                    No holdings yet.
                  </td>
                </tr>
              )}

              {visiblePortfolio.map((holding) => {
                const product = productForHolding(holding.assetId);
                const isSelected = String(selectedProduct?.id) === String(holding.assetId);

                return (
                  <tr
                    key={holding.assetId}
                    onClick={() => {
                      if (product) onSelectProduct(product);
                    }}
                    onKeyDown={(event) => {
                      if (!product || (event.key !== "Enter" && event.key !== " ")) return;
                      event.preventDefault();
                      onSelectProduct(product);
                    }}
                    tabIndex={product ? 0 : undefined}
                    title={product ? "Click to select asset" : "Asset not available in market feed"}
                    className={`border-b border-[#241811] transition ${
                      isSelected
                        ? "bg-amber-500/10 outline outline-1 outline-amber-700/40"
                        : product
                        ? "cursor-pointer hover:bg-[#20160f]"
                        : "opacity-70"
                    }`}
                  >
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isSelected ? "bg-amber-300" : "bg-stone-600"
                          }`}
                        />
                        <span className="truncate font-sans text-sm text-stone-100">
                          {holding.assetName}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right text-stone-300">{holding.quantity}</td>
                    <td className="px-2 py-2.5 text-right text-stone-300">
                      {money.format(holding.averagePrice)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-stone-300">
                      {money.format(holding.currentPrice)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-stone-100">
                      {money.format(holding.marketValue)}
                    </td>
                    <td className={`px-2 py-2.5 text-right ${valueClass(holding.unrealizedPnl)}`}>
                      {money.format(holding.unrealizedPnl)}
                    </td>
                    <td className={`pl-2 py-2.5 text-right ${valueClass(holding.unrealizedPnlPercent)}`}>
                      {holding.unrealizedPnlPercent > 0 ? "+" : ""}
                      {holding.unrealizedPnlPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
