// src/MainRouter.jsx
import { Routes, Route } from "react-router-dom";
import App from "../main/App";
import BoardView from "../components/BoardView";
import Navbar from "../components/Navbar";
import TradingDesktop from "../trading-desktop/TradingDesktop";

export default function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<TradingDesktop />} />
      <Route path="/products" element={<App />} />
      <Route
        path="/board"
        element={
          <>
            <Navbar />
            <BoardView />
          </>
        }
      />
    </Routes>
  );
}
