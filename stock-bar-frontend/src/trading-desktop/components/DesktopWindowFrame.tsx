import { type ComponentType, type ReactNode } from "react";
import { FaMinus, FaTimes } from "react-icons/fa";
import { Rnd } from "react-rnd";
import type { DesktopWindow } from "../types";

type DesktopWindowFrameProps = {
  window: DesktopWindow;
  minWidth: number;
  minHeight: number;
  icon: ComponentType<{ className?: string }>;
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
  icon: Icon,
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
      resizeHandleClasses={{
        top: "mes-resize-handle",
        right: "mes-resize-handle",
        bottom: "mes-resize-handle",
        left: "mes-resize-handle",
        topRight: "mes-resize-handle",
        bottomRight: "mes-resize-handle mes-resize-handle--corner",
        bottomLeft: "mes-resize-handle",
        topLeft: "mes-resize-handle"
      }}
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
      <section className={`mes-window ${isFocused ? "is-focused" : ""}`}>
        <span className="mes-window__corner mes-window__corner--tl" />
        <span className="mes-window__corner mes-window__corner--tr" />
        <span className="mes-window__corner mes-window__corner--bl" />
        <span className="mes-window__corner mes-window__corner--br" />

        <header className="desktop-window-drag-handle mes-window__titlebar">
          <div className="mes-window__rune" aria-hidden="true">
            <Icon />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mes-window__title">
              {window.title}
            </h2>
          </div>

          <div className="desktop-window-no-drag mes-window__controls">
            <button
              type="button"
              title="Minimize"
              aria-label={`Minimize ${window.title}`}
              onClick={() => onMinimize(window.id)}
              className="mes-window__control"
            >
              <FaMinus aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Close"
              aria-label={`Close ${window.title}`}
              onClick={() => onClose(window.id)}
              className="mes-window__control mes-window__control--close"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="mes-window__body">{children}</div>
      </section>
    </Rnd>
  );
}
