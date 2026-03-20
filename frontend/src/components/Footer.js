import React from "react";
import { FaXTwitter, FaTelegram, FaDiscord, FaGithub } from "react-icons/fa6";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-minimal">
      <div className="container">
        <div className="footer-minimal-content">
          <div className="footer-minimal-links">
            <a href="/terms" className="footer-minimal-link">
              Terms
            </a>
            <a href="/privacy" className="footer-minimal-link">
              Privacy
            </a>
            <a href="/Whitepaper.pdf" className="footer-minimal-link">
              Whitepaper
            </a>
            {/* <a href="/faqs" className="footer-minimal-link">
              FAQS
            </a> */}
            <a
              href="mailto:aibtc.finance@gmail.com"
              className="footer-minimal-link"
            >
              Contact us
            </a>
          </div>

          <div className="footer-socials">
            <a
              href="https://x.com/AIBTC_finance"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <FaXTwitter />
            </a>

            <a
              href="https://t.me/+Z8ecYvC-wsg3NTQ8"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <FaTelegram />
            </a>
            {/* 
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <FaDiscord />
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <FaGithub />
            </a> */}
          </div>
        </div>

        <div className="footer-bottom">
          © {year} AIBTC. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
