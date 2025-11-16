import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Homepage from "./components/Homepage";
import DAOPage from "./components/DAOPage";
import ICOPage from "./components/ICOPage";
import Navbar from "./components/Navbar";
import ComingSoonPage from "./components/ComingSoonPage";
import StakingPage from "./components/StakingPage";
import { WalletProvider } from "./components/WalletContext"; // ✅ importa il provider
import NetworkGuard from "./components/NetworkGuard";
import LabPage from "./components/Lab";

function App() {
  return (
    <Router>
      <WalletProvider>
        <div className="App">
          <Navbar />
          <NetworkGuard>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/ico" element={<ICOPage />} />
              <Route path="/dao" element={<StakingPage />} />
              <Route path="/lab" element={<LabPage />} />
            </Routes>
          </NetworkGuard>
        </div>
      </WalletProvider>
    </Router>
  );
}

export default App;
