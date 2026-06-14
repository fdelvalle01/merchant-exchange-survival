import { useCallback, useEffect, useState } from "react";
import {
  getActiveAuction,
  getRelics,
  type RelicResponse,
  type SealedAuctionResponse
} from "../services/relicsApi";

export function useRelics(enabled: boolean) {
  const [relics, setRelics] = useState<RelicResponse[]>([]);
  const [activeAuction, setActiveAuction] = useState<SealedAuctionResponse | null>(null);
  const [isLoadingRelics, setIsLoadingRelics] = useState(enabled);
  const [relicsError, setRelicsError] = useState<string | null>(null);

  const refreshGameItems = useCallback(async () => {
    if (!enabled) return;
    try {
      const [nextRelics, nextAuction] = await Promise.all([getRelics(), getActiveAuction()]);
      setRelics(nextRelics);
      setActiveAuction(nextAuction);
      setRelicsError(null);
    } catch (error) {
      console.error("Could not load relic game state", error);
      setRelicsError("No se pudo cargar el inventario de reliquias.");
    } finally {
      setIsLoadingRelics(false);
    }
  }, [enabled]);

  useEffect(() => {
    refreshGameItems();
  }, [refreshGameItems]);

  return {
    relics,
    activeAuction,
    isLoadingRelics,
    relicsError,
    refreshGameItems
  };
}
