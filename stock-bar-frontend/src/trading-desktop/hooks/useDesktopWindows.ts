import { useCallback, useMemo, useRef, useState } from "react";
import { desktopApps } from "../desktopApps";
import type { DesktopAppId, DesktopWindow } from "../types";

function createDesktopWindow(appId: DesktopAppId, zIndex: number): DesktopWindow {
  const app = desktopApps[appId];

  return {
    id: `${appId}-window`,
    appId,
    title: app.title,
    x: app.defaultPosition.x,
    y: app.defaultPosition.y,
    width: app.defaultSize.width,
    height: app.defaultSize.height,
    zIndex,
    minimized: false
  };
}

export function useDesktopWindows(initialApps: DesktopAppId[] = ["market", "ticket"]) {
  const zIndexRef = useRef(30 + initialApps.length);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(
    initialApps.length > 0 ? `${initialApps[initialApps.length - 1]}-window` : null
  );
  const [windows, setWindows] = useState<DesktopWindow[]>(() =>
    initialApps.map((appId, index) => createDesktopWindow(appId, 31 + index))
  );

  const nextZIndex = useCallback(() => {
    zIndexRef.current += 1;
    return zIndexRef.current;
  }, []);

  const focusWindow = useCallback(
    (windowId: string) => {
      const zIndex = nextZIndex();
      setFocusedWindowId(windowId);
      setWindows((currentWindows) =>
        currentWindows.map((window) =>
          window.id === windowId ? { ...window, zIndex } : window
        )
      );
    },
    [nextZIndex]
  );

  const openWindow = useCallback(
    (appId: DesktopAppId) => {
      const existingWindow = windows.find((window) => window.appId === appId);

      if (existingWindow) {
        const zIndex = nextZIndex();
        setFocusedWindowId(existingWindow.id);
        setWindows((currentWindows) =>
          currentWindows.map((window) =>
            window.id === existingWindow.id
              ? { ...window, minimized: false, zIndex }
              : window
          )
        );
        return;
      }

      const zIndex = nextZIndex();
      const nextWindow = createDesktopWindow(appId, zIndex);
      setFocusedWindowId(nextWindow.id);
      setWindows((currentWindows) => [...currentWindows, nextWindow]);
    },
    [nextZIndex, windows]
  );

  const closeWindow = useCallback((windowId: string) => {
    setWindows((currentWindows) => currentWindows.filter((window) => window.id !== windowId));
    setFocusedWindowId((currentFocusedId) => (currentFocusedId === windowId ? null : currentFocusedId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((currentWindows) =>
      currentWindows.map((window) =>
        window.id === windowId ? { ...window, minimized: true } : window
      )
    );
    setFocusedWindowId((currentFocusedId) => (currentFocusedId === windowId ? null : currentFocusedId));
  }, []);

  const restoreWindow = useCallback(
    (windowId: string) => {
      const zIndex = nextZIndex();
      setFocusedWindowId(windowId);
      setWindows((currentWindows) =>
        currentWindows.map((window) =>
          window.id === windowId ? { ...window, minimized: false, zIndex } : window
        )
      );
    },
    [nextZIndex]
  );

  const updateWindowPosition = useCallback((windowId: string, x: number, y: number) => {
    setWindows((currentWindows) =>
      currentWindows.map((window) =>
        window.id === windowId ? { ...window, x, y } : window
      )
    );
  }, []);

  const updateWindowSize = useCallback((windowId: string, width: number, height: number) => {
    setWindows((currentWindows) =>
      currentWindows.map((window) =>
        window.id === windowId ? { ...window, width, height } : window
      )
    );
  }, []);

  const openAppIds = useMemo(
    () => windows.map((window) => window.appId),
    [windows]
  );

  const focusedWindow = useMemo(
    () => windows.find((window) => window.id === focusedWindowId),
    [focusedWindowId, windows]
  );

  return {
    windows,
    focusedWindowId,
    focusedWindow,
    openAppIds,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize
  };
}
