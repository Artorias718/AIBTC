import React, { useEffect, useState } from "react";
import "./Countdown.css";

const DURATION_SECONDS = 8 * 60 * 60; // 8 ore

const Countdown = () => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000); // unix time
      const cycleRemaining = DURATION_SECONDS - (now % DURATION_SECONDS);

      setRemaining(cycleRemaining === DURATION_SECONDS ? 0 : cycleRemaining);
    };

    tick(); // esegui subito
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="countdown-container">
      <div className="countdown-box">
        <div className="time-block">
          <span className="time">{hours}</span>
          <span className="label">HOURS</span>
        </div>
        <div className="time-block">
          <span className="time">{minutes}</span>
          <span className="label">MINUTES</span>
        </div>
        <div className="time-block">
          <span className="time">{seconds}</span>
          <span className="label">SECONDS</span>
        </div>
      </div>

      <div className="countdown-footer">UNTIL PRICE RISE</div>
    </div>
  );
};

export default Countdown;
