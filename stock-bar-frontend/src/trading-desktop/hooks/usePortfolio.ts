import { useCallback, useEffect, useState } from "react";
import { getPortfolio, type PortfolioHoldingResponse } from "../services/portfolioApi";

type PortfolioState = {
  portfolio: PortfolioHoldingResponse[];
  isLoadingPortfolio: boolean;
  portfolioError: string | null;
  refreshPortfolio: () => Promise<void>;
};

export function usePortfolio(): PortfolioState {
  const [portfolio, setPortfolio] = useState<PortfolioHoldingResponse[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const refreshPortfolio = useCallback(async () => {
    try {
      const nextPortfolio = await getPortfolio();
      setPortfolio(nextPortfolio);
      setPortfolioError(null);
    } catch (error) {
      console.error("Could not load portfolio", error);
      setPortfolioError("No se pudo cargar el portfolio.");
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, []);

  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  return {
    portfolio,
    isLoadingPortfolio,
    portfolioError,
    refreshPortfolio
  };
}
