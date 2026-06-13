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
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Vault Portfolio
          </h2>
          <p className="mes-app__subtitle">
            Value {money.format(marketValue)} | P/L {money.format(totalPnl)}
          </p>
        </div>
        <button
          type="button"
          onClick={onPortfolioChanged}
          className="mes-icon-button"
          title="Refresh portfolio"
          aria-label="Refresh portfolio"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="mes-app__body">
        {isLoadingPortfolio && (
          <div className="mes-banner">
            Loading portfolio...
          </div>
        )}
        {portfolioError && (
          <div className="mes-banner mes-banner--danger">
            {portfolioError}
          </div>
        )}

        <div className="mes-app-table-wrap">
          <table className="mes-table min-w-[780px] table-fixed">
            <thead>
              <tr>
                <th className="w-[23%] text-left">Asset</th>
                <th className="w-[9%] text-right">Qty</th>
                <th className="w-[14%] text-right">Average</th>
                <th className="w-[14%] text-right">Market</th>
                <th className="w-[15%] text-right">Value</th>
                <th className="w-[12%] text-right">Unrealized</th>
                <th className="w-[8%] text-right">P/L %</th>
                <th className="w-[5%] text-right">Alloc.</th>
              </tr>
            </thead>
            <tbody>
              {!isLoadingPortfolio && visiblePortfolio.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center mes-neutral">
                    The vault contains no holdings.
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
                    className={`${isSelected ? "is-selected" : ""} ${
                      product ? "cursor-pointer" : "opacity-60"
                    }`}
                  >
                    <td>
                      <div className="mes-table__asset">
                        <span className="mes-table__marker" />
                        <span className="mes-table__asset-name">
                          {holding.assetName}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">{holding.quantity}</td>
                    <td className="text-right mes-neutral">
                      {money.format(holding.averagePrice)}
                    </td>
                    <td className="text-right">
                      {money.format(holding.currentPrice)}
                    </td>
                    <td className="text-right">
                      {money.format(holding.marketValue)}
                    </td>
                    <td className={`text-right ${valueClass(holding.unrealizedPnl)}`}>
                      {money.format(holding.unrealizedPnl)}
                    </td>
                    <td className={`text-right ${valueClass(holding.unrealizedPnlPercent)}`}>
                      {holding.unrealizedPnlPercent > 0 ? "+" : ""}
                      {holding.unrealizedPnlPercent.toFixed(2)}%
                    </td>
                    <td className="text-right mes-warning">
                      {marketValue > 0 ? `${((holding.marketValue / marketValue) * 100).toFixed(0)}%` : "0%"}
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
