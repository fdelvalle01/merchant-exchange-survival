import { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { DesktopWindow } from "../types";

type DesktopWindowFrameProps = {
  window: DesktopWindow;
  minWidth: number;
  minHeight: number;
  isFocused: boolean;
  children: ReactNode;
  onFocus: (windowId: string) => void;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onPositionChange: (windowId: string, x: number, y: number) => void;
  onSizeChange: (windowId: string, width: number, height: number) => void;
};

export default function DesktopWindowFrame({
  window,
  minWidth,
  minHeight,
  isFocused,
  children,
  onFocus,
  onClose,
  onMinimize,
  onPositionChange,
  onSizeChange
}: DesktopWindowFrameProps) {
  return (
    <Rnd
      bounds="parent"
      size={{ width: window.width, height: window.height }}
      position={{ x: window.x, y: window.y }}
      minWidth={minWidth}
      minHeight={minHeight}
      dragHandleClassName="desktop-window-drag-handle"
      cancel=".desktop-window-no-drag"
      style={{ zIndex: window.zIndex }}
      onMouseDown={() => onFocus(window.id)}
      onDragStart={() => onFocus(window.id)}
      onDragStop={(_, data) => onPositionChange(window.id, data.x, data.y)}
      onResizeStart={() => onFocus(window.id)}
      onResizeStop={(_, __, ref, ___, position) => {
        onSizeChange(window.id, ref.offsetWidth, ref.offsetHeight);
        onPositionChange(window.id, position.x, position.y);
      }}
    >
      <section
        className={`flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-[#100b08]/95 shadow-2xl ${
          isFocused ? "border-amber-600/80" : "border-[#3b2a1f]"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(150deg, rgba(188, 129, 60, 0.08), transparent 40%), repeating-linear-gradient(90deg, rgba(255,255,255,0.016) 0 1px, transparent 1px 18px)"
        }}
      >
        <header className="desktop-window-drag-handle flex h-10 shrink-0 cursor-move items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isFocused ? "bg-amber-300" : "bg-stone-600"}`} />
            <h2 className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-stone-100">
              {window.title}
            </h2>
          </div>

          <div className="desktop-window-no-drag flex items-center gap-1">
            <button
              type="button"
              title="Minimize"
              onClick={() => onMinimize(window.id)}
              className="grid h-6 w-6 place-items-center rounded border border-[#4a3323] bg-black/30 text-xs text-stone-400 hover:border-amber-700/60 hover:text-amber-200"
            >
              -
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => onClose(window.id)}
              className="grid h-6 w-6 place-items-center rounded border border-[#4a3323] bg-black/30 text-xs text-stone-400 hover:border-red-700/70 hover:text-red-300"
            >
              x
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </section>
    </Rnd>
  );
}
