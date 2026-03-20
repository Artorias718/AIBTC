import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import coinAnimation from "../comingsoon.json";
import "./ComingSoonPage.css";

const ComingSoonPage = () => {
  const animationContainer = useRef(null);

  useEffect(() => {
    if (animationContainer.current) {
      const anim = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: coinAnimation,
      });

      return () => anim.destroy();
    }
  }, []);

  return (
    <div className="coming-soon-container">
      <h1 className="title">Coming Soon</h1>

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

      {/* Animazione Lottie */}
      <div ref={animationContainer} className="illustration" />
    </div>
  );
};

export default ComingSoonPage;
