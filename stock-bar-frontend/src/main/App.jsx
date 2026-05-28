import { useEffect, useState } from "react";
import axios from "axios";
import CandleChart from "../components/CandleChart";
import Navbar from "../components/Navbar";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = () => {
    axios.get("/api/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error cargando activos", err));
  };

  const comprar = async (productId) => {
    try {
      await axios.post("/api/sales", {
        productId,
        quantity: 1
      });
      alert("Trade registrado");
    } catch (error) {
      console.error("Error al comprar activo", error);
      alert("Error al registrar trade");
    }
  };

  const verHistorial = async (productId) => {
    try {
      setSelectedProductId(productId);
      const res = await axios.get(`/api/price-history?productId=${productId}`);
      setPriceHistory(res.data);

      setProducts(prev =>
        prev.map(prod =>
          prod.id === productId ? { ...prod, priceHistory: res.data } : prod
        )
      );
    } catch (error) {
      console.error("Error al obtener historial", error);
      alert("No se pudo cargar el historial de precios");
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-24 px-6">
        <h1 className="text-3xl font-bold mb-6">Merchant Exchange Assets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="border p-4 rounded-xl shadow hover:shadow-lg transition">
              <img src={p.imageUrl} alt={p.name} className="h-48 mx-auto object-contain mb-2" />
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-green-600 text-lg font-bold">
                ${p.currentPrice.toLocaleString()}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => comprar(p.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Comprar activo
                </button>
              </div>

              {selectedProductId === p.id && priceHistory.length > 0 && (
                <CandleChart data={priceHistory} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
