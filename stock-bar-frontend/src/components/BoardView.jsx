import { useEffect, useState } from 'react';
import axios from 'axios';
import MiniChart from './MiniChart';

export default function BoardView() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(fetchBoardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBoardData = async () => {
    try {
      const res = await axios.get('/api/products/board');
      const data = res.data.map(p => {
        const diff = p.currentPrice - p.basePrice;
        const percentage = p.basePrice > 0
          ? ((diff / p.basePrice) * 100).toFixed(2)
          : 0;
        return { ...p, diff, percentage };
      });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching board data', err);
    }
  };

  const simulateCrash = async () => {
    await axios.post('/api/simulate/crash');
    fetchBoardData();
  };

  const simulateBoom = async () => {
    await axios.post('/api/simulate/boom');
    fetchBoardData();
  };

  return (
    <div className="pt-[104px] p-4 bg-black text-white min-h-screen font-mono">
      <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-2">
        Market Board
      </h2>

      <table className="w-full border-collapse text-sm">
        <thead className="bg-blue-900 text-white uppercase text-xs tracking-wide">
          <tr>
            <th className="p-2 text-left">Activo</th>
            <th className="p-2 text-right">Inicial</th>
            <th className="p-2 text-right">Actual</th>
            <th className="p-2 text-right">Cambio $</th>
            <th className="p-2 text-right">% Var</th>
            <th className="p-2 text-right">Peak</th>
            <th className="p-2 text-right">% desde peak</th>
            <th className="p-2 text-right">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-t border-gray-700 hover:bg-gray-800 transition">
              <td className="p-2">{p.name}</td>
              <td className="p-2 text-right">${p.basePrice.toFixed(2)}</td>
              <td className="p-2 text-right">${p.currentPrice.toFixed(2)}</td>

              <td className={`p-2 text-right ${p.diff > 0 ? 'text-green-500' : p.diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {p.diff > 0 ? '+' : ''}{p.diff.toFixed(2)}
              </td>
              <td className={`p-2 text-right ${p.percentage > 0 ? 'text-green-500' : p.percentage < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {p.percentage > 0 ? 'UP' : p.percentage < 0 ? 'DOWN' : ''} {p.percentage}%
              </td>
              <td className="p-2 text-right">${p.maxPrice.toFixed(2)}</td>
              <td
                className={`p-2 text-right ${
                  p.percentageDropFromMax > 0
                    ? 'text-red-500'
                    : p.percentageDropFromMax === 0
                    ? 'text-gray-400'
                    : 'text-green-500'
                }`}
              >
                {p.percentageDropFromMax > 0
                  ? `DOWN ${p.percentageDropFromMax.toFixed(2)}%`
                  : '-'}
              </td>
              <td className="p-2 w-28">
                <MiniChart data={p.history} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex gap-4">
        <button onClick={simulateCrash} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-white font-bold">
          Simular Crash
        </button>
        <button onClick={simulateBoom} className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded text-white font-bold">
          Simular Boom
        </button>
      </div>
    </div>
  );
}
