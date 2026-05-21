import { money, percentFor, signalFor, valueClass } from "../marketUtils";
import type { DesktopAppRenderProps } from "../types";

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
      <td colSpan={6} className="py-8 text-center text-sm text-stone-500">
        <div className="flex flex-col items-center gap-3">
          <span>{message}</span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-md border border-amber-700/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
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
          <p className="text-[11px] text-stone-500">
            {productsError && hasProducts ? "Feed con ultimo dato disponible" : "Ale instruments, live tavern exchange"}
          </p>
        </div>
        <div className="rounded border border-amber-700/40 bg-black/30 px-2 py-1 font-mono text-[10px] text-amber-300">
          MB-01
        </div>
      </div>

      <div className="overflow-x-auto p-2.5">
        <table className="w-full min-w-[580px] table-fixed border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-[#3b2a1f] text-left text-stone-500">
              <th className="w-[32%] py-2 pr-2 font-medium">Product</th>
              <th className="w-[16%] px-2 py-2 text-right font-medium">Last</th>
              <th className="w-[14%] px-2 py-2 text-right font-medium">Change %</th>
              <th className="w-[16%] px-2 py-2 text-right font-medium">Peak</th>
              <th className="w-[11%] px-2 py-2 text-right font-medium">Signal</th>
              <th className="w-[11%] pl-2 py-2 text-right font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingProducts && !hasProducts && <MarketStateRow message="Loading products..." />}
            {!isLoadingProducts && productsError && !hasProducts && (
              <MarketStateRow
                message={productsError}
                actionLabel="Retry"
                onAction={onRetryProducts}
              />
            )}
            {!isLoadingProducts && !productsError && !hasProducts && (
              <MarketStateRow message="Empty products. No hay instrumentos disponibles." />
            )}

            {products.map((product) => {
              const percent = percentFor(product);
              const isSelected = String(selectedProduct?.id) === String(product.id);

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={`cursor-pointer border-b border-[#241811] transition ${
                    isSelected
                      ? "bg-amber-500/10 outline outline-1 outline-amber-700/40"
                      : "hover:bg-[#20160f]"
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? "bg-amber-300" : "bg-stone-600"
                        }`}
                      />
                      <span className="truncate font-sans text-sm font-medium text-stone-100">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-100">
                    {money.format(product.currentPrice)}
                  </td>
                  <td className={`px-2 py-2.5 text-right ${valueClass(percent)}`}>
                    {percent > 0 ? "+" : ""}
                    {percent.toFixed(2)}%
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-400">
                    {money.format(product.maxPrice ?? product.currentPrice)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProduct(product);
                        onOpenApp("ticket");
                      }}
                      className={`rounded border border-transparent px-2 py-1 text-[11px] transition hover:border-amber-700/50 hover:bg-amber-500/10 ${valueClass(percent)}`}
                      title="Abrir Order Ticket"
                    >
                      {signalFor(product)}
                    </button>
                  </td>
                  <td className="pl-2 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProduct(product);
                        onOpenApp("detail");
                      }}
                      className="rounded border border-transparent px-1.5 py-1 text-[11px] text-amber-200 transition hover:border-amber-700/50 hover:bg-amber-500/10"
                      title="Abrir Product Detail"
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
    </section>
  );
}
