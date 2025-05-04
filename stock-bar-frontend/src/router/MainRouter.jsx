// src/MainRouter.jsx
import { Routes, Route } from "react-router-dom";
import App from "../main/App";
import BoardView from "../components/BoardView";
import Navbar from "../components/Navbar";

export default function MainRouter() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/board" element={<BoardView />} />
      </Routes>
    </>
  );
}
