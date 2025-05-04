import { FaBeer, FaChartLine, FaUtensils, FaHome } from 'react-icons/fa';
import TickerBar from './TickerBar';
import { Link } from "react-router-dom";
export default function Navbar() {
  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold">
            <FaBeer />
            <span>Stock Bar</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-yellow-400">Inicio</Link>
            <a href="#" className="hover:text-yellow-400 flex items-center gap-1">
              <FaUtensils /> Carta
            </a>
            <Link to="/board" className="hover:text-yellow-400">📈 Precios</Link>
          </div>
        </div>
        <TickerBar /> {/* Aquí va justo debajo del nav principal */}
      </nav>
    </>
  );
}
