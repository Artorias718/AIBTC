import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { FaWallet } from "react-icons/fa";

const Navbar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const location = useLocation();

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsConnected(true);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount("");
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
            <a
              href="https://docs.aibtc.finance"
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
