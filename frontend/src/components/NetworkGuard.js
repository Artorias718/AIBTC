import React, { useContext } from "react";
import { WalletContext } from "./WalletContext";

const NetworkGuard = ({ children }) => {
  const { isConnected, isCorrectNetwork, switchNetwork } =
    useContext(WalletContext);

  return (
    <>
      {/* 🔶 Banner visibile solo se la rete è sbagliata */}
      {isConnected && !isCorrectNetwork && (
        <div
          style={{
            background: "#ffcc00",
            color: "#000",
            padding: "12px 20px",
            textAlign: "center",
            fontWeight: "600",
            borderBottom: "2px solid #000",
          }}
        >
          ⚠️ Wrong Network – Please switch to{" "}
          <strong>Arbitrum Sepolia Chain</strong>{" "}
          <button
            onClick={switchNetwork}
            style={{
              marginLeft: "10px",
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Switch Network
          </button>
        </div>
      )}

      {/* 🔹 Contenuto normale dell'app */}
      {children}
    </>
  );
};

export default NetworkGuard;
