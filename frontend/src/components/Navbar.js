// src/components/Navbar.js
import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaWallet, FaBars, FaTimes } from "react-icons/fa";
import { WalletContext } from "./WalletContext";
import "./Navbar.css";

const Navbar = () => {
  const { isConnected, account, connectWallet, disconnectWallet } =
    useContext(WalletContext);
  const location = useLocation();

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <img src="text_logo.png" alt="aibtc" className="logo-img" />
          </Link>

          {/* HAMBURGER BUTTON (mobile only) */}
          <button className="hamburger" onClick={toggleMenu}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Desktop Links */}
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
              to="/staking"
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
            <Link
              to="/luckydrop"
              className={`nav-link ${
                location.pathname === "/luckydrop" ? "active" : ""
              }`}
            >
              LuckyDrop
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

          {/* Wallet desktop */}
          <div className="wallet-section wallet-desktop">
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

        {/* MOBILE MENU */}
        <div className={`nav-menu ${menuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            to="/ico"
            className={`nav-link ${
              location.pathname === "/ico" ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            ICO
          </Link>
          <Link
            to="/dao"
            className={`nav-link ${
              location.pathname === "/dao" ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Staking
          </Link>
          <Link
            to="/lab"
            className={`nav-link ${
              location.pathname === "/lab" ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Lab
          </Link>
          <a
            href="/Whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            onClick={closeMenu}
          >
            Whitepaper
          </a>

          {/* Wallet mobile */}
          <div className="wallet-mobile">
            {isConnected ? (
              <div className="wallet-connected">
                <span className="wallet-address">{formatAddress(account)}</span>
                <button
                  onClick={() => {
                    disconnectWallet();
                    closeMenu();
                  }}
                  className="btn btn-secondary btn-small"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  connectWallet();
                  closeMenu();
                }}
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
