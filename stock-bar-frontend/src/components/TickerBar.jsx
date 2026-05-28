import { useTicker } from '../context/TickerContext';

export default function TickerBar() {
  const { products } = useTicker();

  return (
    <div className="border-t border-b border-gray-800 py-2 overflow-hidden bg-black">
      <div className="animate-marquee inline-block">
        {products.map(p => (
          <span
            key={p.id}
            className={`font-dot text-lg mr-6 ${
              p.trend === 'up'
                ? 'text-green-400'
                : p.trend === 'down'
                ? 'text-red-400'
                : 'text-gray-300'
            }`}
          >
            {p.name.toUpperCase()}-${p.currentPrice.toFixed(2)}
            {p.trend === 'up' ? ' UP' : p.trend === 'down' ? ' DOWN' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
