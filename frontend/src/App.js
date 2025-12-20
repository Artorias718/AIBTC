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
import TransakUSDTArbitrum from "./components/TransakUSDTArbitrum";
import WheelOfFortune from "./components/Wheel";

function App() {
  return (
    <Router>
      <WalletProvider>
        <div className="App">
          <Navbar />
          <NetworkGuard>
            <Routes>
              <Route path="/" element={<Homepage />} />
              {/* <Route path="/ico" element={<ICOPage />} />
              <Route path="/staking" element={<StakingPage />} />
              <Route path="/lab" element={<LabPage />} /> */}
              <Route path="/ico" element={<ICOPage />} />
              <Route path="/staking" element={<StakingPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/Luckydrop" element={<ComingSoonPage />} />
              <Route path="/test" element={<WheelOfFortune />} />
            </Routes>
          </NetworkGuard>
        </div>
      </WalletProvider>
    </Router>
  );
}

export default App;
