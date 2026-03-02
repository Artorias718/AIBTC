import React from "react";

export default function SwapWidgetCard() {
  const url = "https://app.uniswap.org/#/swap?chain=base";

  const openNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <iframe
          title="Uniswap Swap (Base)"
          src={url}
          style={{
            width: "100%",
            height: 640,
            border: 0,
            display: "block",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="clipboard-read; clipboard-write"
        />
      </div>

      <div style={{ textAlign: "center", marginTop: 12, opacity: 0.9 }}>
        Se lo swap non si carica,{" "}
        <button
          onClick={openNewTab}
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            background: "transparent",
            border: "none",
            padding: 0,
            color: "inherit",
            font: "inherit",
          }}
        >
          apri Uniswap in una nuova scheda
        </button>
        .
      </div>
    </div>
  );
}
