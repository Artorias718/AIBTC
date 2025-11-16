import { useEffect, useState } from "react";

export default function Modal() {
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hideModal = localStorage.getItem("hideMyPopup");

    if (hideModal !== "true") {
      setShow(true);
    }
  }, []);

  function closeModal() {
    if (dontShowAgain) {
      localStorage.setItem("hideMyPopup", "true");
    }
    setShow(false);
  }

  if (!show) return null; // non mostra nulla

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Bip Bop..Welcome to the Lab!</h2>
        <p>This page displays all your Module NFTs</p>
        <p>
          Modules are tradable on the market and can be purchased to increase
          your staking rewards. Only a limited number of modules will ever be
          minted, so mint yours now before they run out!
        </p>
        <p>
          The first module can be minted for free if you own at least one AIBTC
        </p>

        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />{" "}
          Non mostrare più
        </label>

        <button onClick={closeModal} style={styles.button}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    zIndex: 99999,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "white",
    padding: "20px",
    width: "650px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 0 15px rgba(0,0,0,0.3)",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#007bff",
    color: "white",
    cursor: "pointer",
  },
};
