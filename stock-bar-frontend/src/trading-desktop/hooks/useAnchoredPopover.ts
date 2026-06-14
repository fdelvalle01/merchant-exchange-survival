import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const VIEWPORT_MARGIN = 12;
const POPOVER_GAP = 8;
const POPOVER_WIDTH = 360;

export function useAnchoredPopover(
  anchor: HTMLElement | null,
  onClose: () => void
) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!anchor) return;

    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - VIEWPORT_MARGIN)
      );

      setStyle({
        position: "fixed",
        left,
        bottom: Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.top + POPOVER_GAP),
        width,
        maxHeight: Math.max(180, rect.top - VIEWPORT_MARGIN * 2)
      });
    };

    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchor.contains(target) || popoverRef.current?.contains(target)) return;
      onClose();
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);

    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [anchor, onClose]);

  return { popoverRef, style };
}
