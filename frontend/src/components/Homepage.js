import React from "react";
import "./Homepage.css";

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Welcome to the Future of
                <span className="highlight"> Crypto Trading</span>
              </h1>
              <p className="hero-description">
                Discover AIBTC, the cutting-edge token that powers AI-driven
                Bitcoin trading. Use AIBTC to access advanced algorithms
                designed to optimize your trading strategy and maximize returns
              </p>
              <div className="hero-buttons">
                <a href="/dao" className="btn btn-primary btn-large">
                  Explore AIBTC
                </a>
                <a href="/ico" className="btn btn-secondary btn-large">
                  Join ICO
                </a>
              </div>
            </div>
            <div className="hero-video">
              <video src="/ter.webm" autoPlay loop muted playsInline />
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 2 */}
      <section className="hero2">
        <div className="container">
          <div className="hero-content">
            <div className="hero-image">
              <img src="/tc3.png" alt="Descrizione immagine" />
            </div>
            <div className="hero-text">
              <h1 className="hero-title">
                Stake Your AIBTC to
                <span className="highlight"> Unlock AI Signals</span>
              </h1>
              <p className="hero-description">
                Stake your AIBTC to access exclusive AI-generated trading
                signals while earning rewards at the same time. Turn your tokens
                into a powerful trading companion effortlessly
              </p>
              <div className="hero-buttons">
                <a href="/dao" className="btn btn-primary btn-large">
                  Explore DAO
                </a>
                <a href="/ico" className="btn btn-secondary btn-large">
                  Join ICO
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Hero Section 3 */}
      <section className="hero2">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Mistake-Driven
                <span className="highlight"> Token Burns</span>
              </h1>
              <p className="hero-description">
                When the AI makes a wrong prediction, AIBTC takes action to
                safeguard your holdings. A portion of tokens is burned
                automatically, reducing supply and helping maintain the value of
                your staked and held tokens.
              </p>
              <div className="hero-buttons">
                <a href="/dao" className="btn btn-primary btn-large">
                  Explore AIBTC
                </a>
                <a href="/ico" className="btn btn-secondary btn-large">
                  Join ICO
                </a>
              </div>
            </div>
            <div className="hero-image">
              <img src="/flame.png" alt="Descrizione immagine" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our DAO Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🗳️</div>
              <h3>Democratic Voting</h3>
              <p>
                Participate in transparent voting processes where every member
                has an equal voice in important decisions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Transparent</h3>
              <p>
                Built on blockchain technology ensuring security, transparency,
                and immutability of all governance decisions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global Community</h3>
              <p>
                Connect with a worldwide community of like-minded individuals
                working towards common goals and shared values.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Efficient</h3>
              <p>
                Streamlined governance processes that enable quick
                decision-making while maintaining thorough deliberation.
              </p>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Homepage;
