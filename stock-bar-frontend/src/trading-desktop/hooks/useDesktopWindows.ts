import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { desktopApps } from "../desktopApps";
import type { DesktopAppId, DesktopWindow } from "../types";

function createDesktopWindow(appId: DesktopAppId, zIndex: number): DesktopWindow {
  const app = desktopApps[appId];
  const workspaceWidth = typeof window === "undefined" ? 1280 : Math.max(window.innerWidth - 68, 320);
  const workspaceHeight = typeof window === "undefined" ? 640 : Math.max(window.innerHeight - 126, 240);
  const width = Math.min(app.defaultSize.width, workspaceWidth);
  const height = Math.min(app.defaultSize.height, workspaceHeight);

  return {
    id: `${appId}-window`,
    appId,
    title: app.title,
    x: Math.max(0, Math.min(app.defaultPosition.x, workspaceWidth - width)),
    y: Math.max(0, Math.min(app.defaultPosition.y, workspaceHeight - height)),
    width,
    height,
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

  useEffect(() => {
    const clampWindowsToViewport = () => {
      const workspaceWidth = Math.max(window.innerWidth - (window.innerWidth <= 760 ? 56 : 68), 320);
      const workspaceHeight = Math.max(window.innerHeight - 126, 240);

      setWindows((currentWindows) =>
        currentWindows.map((desktopWindow) => {
          const width = Math.min(desktopWindow.width, workspaceWidth);
          const height = Math.min(desktopWindow.height, workspaceHeight);
          return {
            ...desktopWindow,
            width,
            height,
            x: Math.max(0, Math.min(desktopWindow.x, workspaceWidth - width)),
            y: Math.max(0, Math.min(desktopWindow.y, workspaceHeight - height))
          };
        })
      );
    };

    window.addEventListener("resize", clampWindowsToViewport);
    return () => window.removeEventListener("resize", clampWindowsToViewport);
  }, []);

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
