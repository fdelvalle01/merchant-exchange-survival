import { useCallback, useEffect, useState } from "react";
import { getMyCompany, type PlayerCompanyResponse } from "../services/companyApi";

type CompanyState = {
  company: PlayerCompanyResponse | null;
  isLoadingCompany: boolean;
  companyError: string | null;
  refreshCompany: () => Promise<void>;
};

export function useCompany(): CompanyState {
  const [company, setCompany] = useState<PlayerCompanyResponse | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const refreshCompany = useCallback(async () => {
    try {
      const nextCompany = await getMyCompany();
      setCompany(nextCompany);
      setCompanyError(null);
    } catch (error) {
      console.error("Could not load player company", error);
      setCompanyError("No se pudo cargar la compania.");
    } finally {
      setIsLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  return {
    company,
    isLoadingCompany,
    companyError,
    refreshCompany
  };
}
