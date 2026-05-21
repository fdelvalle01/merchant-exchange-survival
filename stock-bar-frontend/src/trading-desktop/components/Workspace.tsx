import { desktopApps } from "../desktopApps";
import DesktopWindowFrame from "./DesktopWindowFrame";
import type { DesktopAppId, DesktopWindow, TradingInstrument } from "../types";

type WorkspaceProps = {
  windows: DesktopWindow[];
  focusedWindowId: string | null;
  products: TradingInstrument[];
  selectedProduct?: TradingInstrument;
  onSelectProduct: (product: TradingInstrument) => void;
  onOrderCreated: () => void | Promise<void>;
  isLoadingProducts: boolean;
  productsError: string | null;
  onRetryProducts: () => void;
  onOpenApp: (appId: DesktopAppId) => void;
  onCloseWindow: (windowId: string) => void;
  onFocusWindow: (windowId: string) => void;
  onMinimizeWindow: (windowId: string) => void;
  onWindowPositionChange: (windowId: string, x: number, y: number) => void;
  onWindowSizeChange: (windowId: string, width: number, height: number) => void;
};

export default function Workspace({
  windows,
  focusedWindowId,
  products,
  selectedProduct,
  onSelectProduct,
  onOrderCreated,
  isLoadingProducts,
  productsError,
  onRetryProducts,
  onOpenApp,
  onCloseWindow,
  onFocusWindow,
  onMinimizeWindow,
  onWindowPositionChange,
  onWindowSizeChange
}: WorkspaceProps) {
  const visibleWindows = windows.filter((window) => !window.minimized);

  return (
    <main
      className="relative min-h-0 overflow-hidden bg-[#070504]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 16% 0%, rgba(132, 85, 38, 0.16), transparent 30%), radial-gradient(circle at 78% 22%, rgba(91, 76, 55, 0.14), transparent 28%), linear-gradient(180deg, #080604 0%, #050403 100%)"
      }}
    >
      {windows.length === 0 && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-md rounded-md border border-[#3b2a1f] bg-black/25 p-6 shadow-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
              Workspace vacío
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Abre Market o Ticket desde el sidebar para comenzar a operar.
            </p>
          </div>
        </div>
      )}

      {windows.length > 0 && visibleWindows.length === 0 && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-md rounded-md border border-[#3b2a1f] bg-black/25 p-6 shadow-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
              Ventanas minimizadas
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Restaura una ventana desde la barra inferior.
            </p>
          </div>
        </div>
      )}

      {visibleWindows.map((window) => {
        const app = desktopApps[window.appId];
        const AppComponent = app.component;

        return (
          <DesktopWindowFrame
            key={window.id}
            window={window}
            minWidth={app.minSize.width}
            minHeight={app.minSize.height}
            isFocused={focusedWindowId === window.id}
            onFocus={onFocusWindow}
            onClose={onCloseWindow}
            onMinimize={onMinimizeWindow}
            onPositionChange={onWindowPositionChange}
            onSizeChange={onWindowSizeChange}
          >
            <AppComponent
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={onSelectProduct}
              onOrderCreated={onOrderCreated}
              isActive={focusedWindowId === window.id}
              isLoadingProducts={isLoadingProducts}
              productsError={productsError}
              onRetryProducts={onRetryProducts}
              onOpenApp={onOpenApp}
            />
          </DesktopWindowFrame>
        );
      })}
    </main>
  );
}
