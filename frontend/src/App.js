import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";

import Homepage from "./components/Homepage";
import DAOPage from "./components/DAOPage";
import ICOPage from "./components/ICOPage";
import Navbar from "./components/Navbar";
import ComingSoonPage from "./components/ComingSoonPage";
import StakingPage from "./components/StakingPage";
import { WalletProvider } from "./components/WalletContext";
import NetworkGuard from "./components/NetworkGuard";
import LabPage from "./components/Lab";
import WheelOfFortune from "./components/Wheel";
import AdminDashboard from "./components/AdminDashboard";
import SwapWidgetCard from "./components/SwapWidgetCard";
import Footer from "./components/Footer";
import TermsPage from "./components/TermsPage";
import PrivacyPage from "./components/PrivacyPage";

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="App">
      {!isAdmin && <Navbar />}

      {!isAdmin ? (
        <>
          <NetworkGuard>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/ico" element={<ICOPage />} />
              <Route path="/staking" element={<StakingPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/Luckydrop" element={<ComingSoonPage />} />
              <Route path="/test" element={<WheelOfFortune />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/swap" element={<SwapWidgetCard />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </NetworkGuard>

          <Footer />
        </>
      ) : (
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/swap" element={<SwapWidgetCard />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <WalletProvider>
        <AppRoutes />
      </WalletProvider>
    </Router>
  );
}

export default App;
