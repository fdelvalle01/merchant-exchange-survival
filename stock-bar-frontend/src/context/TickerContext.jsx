import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

const TickerContext = createContext();

export function TickerProvider({ children }) {
  const [products, setProducts] = useState([]);
  const { isReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      setProducts([]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchPrices = async () => {
      try {
        const res = await axios.get("/api/products/detailed", {
          signal: controller.signal
        });

        if (!isMounted) return;

        const newData = res.data;
        setProducts((currentProducts) =>
          JSON.stringify(currentProducts) !== JSON.stringify(newData)
            ? newData
            : currentProducts
        );
      } catch (error) {
        if (axios.isCancel(error) || error.code === "ERR_CANCELED") return;

        if (error.response?.status === 401) {
          setProducts([]);
          return;
        }

          console.warn("Ticker feed unavailable", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [isReady, isAuthenticated]);

  return (
    <TickerContext.Provider value={{ products }}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  return useContext(TickerContext);
}
