import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Homepage from "./components/Homepage";
import DAOPage from "./components/DAOPage";
import ICOPage from "./components/ICOPage";
import Navbar from "./components/Navbar";
import ComingSoonPage from "./components/ComingSoonPage";
import StakingPage from "./components/StakingPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/ico" element={<ICOPage />} />
          <Route path="/dao" element={<StakingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
