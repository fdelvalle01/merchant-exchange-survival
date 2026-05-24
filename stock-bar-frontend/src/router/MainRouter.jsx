// src/MainRouter.jsx
import { Routes, Route } from "react-router-dom";
import App from "../main/App";
import BoardView from "../components/BoardView";
import Navbar from "../components/Navbar";
import TradingDesktop from "../trading-desktop/TradingDesktop";
import { RequireAuth } from "../auth/AuthContext";

function protectedRoute(element) {
  return <RequireAuth>{element}</RequireAuth>;
}

export default function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={protectedRoute(<TradingDesktop />)} />
      <Route path="/products" element={protectedRoute(<App />)} />
      <Route
        path="/board"
        element={protectedRoute(
          <>
            <Navbar />
            <BoardView />
          </>
        )}
      />
    </Routes>
  );
}
