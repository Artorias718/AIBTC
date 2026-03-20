import { useState } from "react";
import { motion } from "framer-motion";

const CoinFlipper = () => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [rotation, setRotation] = useState(0);

  const flipCoin = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    // Genera un numero casuale di giri (minimo 5) + 180 gradi per cambiare faccia
    const extraDegrees = Math.random() > 0.5 ? 180 : 0;
    const newRotation = rotation + (1800 + extraDegrees);

    setRotation(newRotation);

    // Blocca il tasto finché l'animazione non finisce
    setTimeout(() => setIsFlipping(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div style={{ perspective: "1000px" }}>
        <motion.div
          animate={{ rotateY: rotation }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            width: "150px",
            height: "150px",
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {/* FACCIA A (TESTA) */}
          <div
            style={{
              ...faceStyle,
              backgroundImage: "url('URL_IMMAGINE_TESTA')", // <--- SOSTITUISCI QUI
              backgroundColor: "#ffd700",
            }}
          >
            {/* Se non metti l'immagine, apparirà questo testo */}
            <span style={{ backfaceVisibility: "hidden" }}>TESTA</span>
          </div>

          {/* FACCIA B (CROCE) */}
          <div
            style={{
              ...faceStyle,
              backgroundImage: "url('URL_IMMAGINE_CROCE')", // <--- SOSTITUISCI QUI
              backgroundColor: "#ffae00",
              transform: "rotateY(180deg)",
            }}
          >
            <span style={{ backfaceVisibility: "hidden" }}>CROCE</span>
          </div>
        </motion.div>
      </div>

      <button onClick={flipCoin} disabled={isFlipping} style={buttonStyle}>
        {isFlipping ? "Lancio in corso..." : "Lancia la moneta"}
      </button>
    </div>
  );
};

// Stili base per le facce della moneta
const faceStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  backfaceVisibility: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: "bold",
  backgroundSize: "cover",
  border: "4px solid #b8860b",
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "8px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
};

export default CoinFlipper;
