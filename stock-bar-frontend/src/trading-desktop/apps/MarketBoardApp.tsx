import { money, percentFor, signalFor, valueClass } from "../marketUtils";
import type { DesktopAppRenderProps } from "../types";
import { AssetIcon } from "../visualCatalog";

function MarketStateRow({
  message,
  actionLabel,
  onAction
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center gap-3">
          <span>{message}</span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mes-button mes-button--compact"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function MarketBoardApp({
  currentUser,
  products,
  selectedProduct,
  onSelectProduct,
  isActive,
  isLoadingProducts,
  productsError,
  onRetryProducts,
  onOpenApp
}: DesktopAppRenderProps) {
  const hasProducts = products.length > 0;
  const canOpenTicket = currentUser.roles.some((role) => role === "TRADER" || role === "ADMIN_BAR");

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Market Board
          </h2>
          <p className="mes-app__subtitle">
            {productsError && hasProducts ? "Showing the last available exchange reading" : "Real assets from the kingdom exchange"}
          </p>
        </div>
        <div className="mes-code-badge">
          MB-01
        </div>
      </div>

      <div className="mes-app__body">
        {productsError && hasProducts && (
          <div className="mes-banner mes-banner--warning">{productsError}</div>
        )}
        <div className="mes-app-table-wrap">
        <table className="mes-table min-w-[680px] table-fixed">
          <thead>
            <tr>
              <th className="w-[29%] text-left">Asset</th>
              <th className="w-[14%] text-right">Last</th>
              <th className="w-[12%] text-right">Change</th>
              <th className="w-[13%] text-right">Base</th>
              <th className="w-[13%] text-right">Peak</th>
              <th className="w-[10%] text-right">Signal</th>
              <th className="w-[9%] text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingProducts && !hasProducts && <MarketStateRow message="Loading assets..." />}
            {!isLoadingProducts && productsError && !hasProducts && (
              <MarketStateRow
                message={productsError}
                actionLabel="Retry"
                onAction={onRetryProducts}
              />
            )}
            {!isLoadingProducts && !productsError && !hasProducts && (
              <MarketStateRow message="Empty assets. No hay instrumentos disponibles." />
            )}

            {products.map((product) => {
              const percent = percentFor(product);
              const isSelected = String(selectedProduct?.id) === String(product.id);

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onSelectProduct(product);
                  }}
                  tabIndex={0}
                  className={`cursor-pointer ${isSelected ? "is-selected" : ""}`}
                >
                  <td>
                    <div className="mes-table__asset">
                      <AssetIcon name={product.name} sector={product.sector} />
                      <span className="mes-table__asset-name">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right mes-warning">
                    {money.format(product.currentPrice)}
                  </td>
                  <td className={`text-right ${valueClass(percent)}`}>
                    {percent > 0 ? "+" : ""}
                    {percent.toFixed(2)}%
                  </td>
                  <td className="text-right mes-neutral">
                    {money.format(product.basePrice)}
                  </td>
                  <td className="text-right mes-neutral">
                    {money.format(product.maxPrice ?? product.currentPrice)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProduct(product);
                        if (canOpenTicket) {
                          onOpenApp("ticket");
                        }
                      }}
                      className={`mes-signal ${valueClass(percent)}`}
                      title={canOpenTicket ? "Open Royal Ticket" : "Ticket restricted by role"}
                    >
                      {signalFor(product)}
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProduct(product);
                        onOpenApp("detail");
                      }}
                      className="mes-button mes-button--compact"
                      title="Open Asset Chronicle"
                    >
                      INFO
                    </button>
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
