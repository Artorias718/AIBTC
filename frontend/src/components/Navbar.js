// src/components/Navbar.js
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaWallet } from "react-icons/fa";
import { WalletContext } from "./WalletContext";
import "./Navbar.css";

const Navbar = () => {
  const { isConnected, account, connectWallet, disconnectWallet } =
    useContext(WalletContext);
  const location = useLocation();

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <img src="text_logo.png" alt="aibtc" className="logo-img" />
          </Link>

          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${
                location.pathname === "/" ? "active" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/ico"
              className={`nav-link ${
                location.pathname === "/ico" ? "active" : ""
              }`}
            >
              ICO
            </Link>
            <Link
              to="/dao"
              className={`nav-link ${
                location.pathname === "/dao" ? "active" : ""
              }`}
            >
              Staking
            </Link>
            <Link
              to="/lab"
              className={`nav-link ${
                location.pathname === "/lab" ? "active" : ""
              }`}
            >
              Lab
            </Link>
            <a
              href="/Whitepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Whitepaper
            </a>
          </div>

          <div className="wallet-section">
            {isConnected ? (
              <div className="wallet-connected">
                <span className="wallet-address">{formatAddress(account)}</span>
                <button
                  onClick={disconnectWallet}
                  className="btn btn-secondary btn-small"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="btn btn-primary connect-wallet"
              >
                <FaWallet className="wallet-btn-icon" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
