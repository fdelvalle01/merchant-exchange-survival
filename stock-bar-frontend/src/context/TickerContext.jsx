import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const TickerContext = createContext();

export function TickerProvider({ children }) {
  const [products, setProducts] = useState([]);
  const fetchPrices = async () => {
    const res = await axios.get("/api/products/detailed");
    const newData = res.data;
    if (JSON.stringify(products) !== JSON.stringify(newData)) {
      setProducts(newData);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TickerContext.Provider value={{ products }}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  return useContext(TickerContext);
}
