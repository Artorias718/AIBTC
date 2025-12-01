import React from "react";
import "./ComingSoonPage.css";

const ComingSoonPage = () => {
  return (
    <div className="coming-soon-container">
      {/* Logo
      <img src="/aibtc.png" alt="Logo" className="logo" /> */}

      {/* Titolo */}
      <h1 className="title">Coming Soon</h1>

      {/* Sottotitolo con link */}
      <p className="subtitle">
        Meanwhile, explore our{" "}
        <a
          href="https://aibtc.finance/Whitepaper"
          target="_blank"
          rel="noopener noreferrer"
          className="docs-link"
        >
          whitepaper
        </a>
        .
      </p>

      {/* Immagine */}
      <img
        src="/work.png"
        alt="Coming Soon Illustration"
        className="illustration"
      />
    </div>
  );
};

export default ComingSoonPage;
