import React, { useEffect, useState } from "react";

export default function TransakUSDCArbitrum() {
  const [walletAddress, setWalletAddress] = useState(null);

  // Controlla se l’utente è connesso a MetaMask
  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) setWalletAddress(accounts[0]);
        } catch (err) {
          console.error("Errore nel leggere MetaMask:", err);
        }
      }
    };
    getAccount();
  }, []);

  const crypto = "USDC";
  //const network = "arbitrum";
  const network = "base";
  const fiatCurrency = "EUR";

  const handleBuy = () => {
    let transakUrl = `https://global.transak.com?apiKey=&cryptoCurrencyCode=${crypto}&network=${network}&fiatCurrency=${fiatCurrency}`;

    if (walletAddress) {
      transakUrl += `&walletAddress=${walletAddress}`;
    }

    window.open(
      transakUrl,
      "transakPopup",
      "width=500,height=700,resizable,scrollbars=yes,status=1",
    );
  };

  return (
    <div className="w-full flex flex-col items-center p-6 gap-4">
      <div className="flex flex-col items-center gap-5">
        <h2 className="text-xl font-bold" style={{ color: "#7794e3ff" }}>
          Don’t have USDC? Top up here
        </h2>{" "}
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <img
            src="https://on-ramp-cache.api.cx.metamask.io/assets/Mastercard-regular@3x.png"
            alt="Mastercard"
            className="h-6"
          />
          <img
            src="https://on-ramp-cache.api.cx.metamask.io/assets/Visa-regular@3x.png"
            alt="Visa"
            className="h-6"
          />
          <img
            src="https://on-ramp-cache.api.cx.metamask.io/assets/SEPABankTransfer-regular@3x.png"
            alt="SEPA"
            className="h-6"
          />
          <img
            src="https://assets.transak.com/images/ui/payment-method/apple_pay-dark.svg"
            alt="apple pay"
            className="h-6"
          />
          <img
            src="https://assets.transak.com/images/ui/payment-method/google_pay-dark.svg"
            alt="google pay"
            className="h-6"
          />
          <img
            src="https://assets.transak.com/images/ui/payment-method/pm_open_banking-dark.svg"
            alt="open banking"
            className="h-6"
          />
        </div>
      </div>

      <button
        onClick={handleBuy}
        className="px-6 py-3 rounded-2xl shadow bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Top up USDC
      </button>
    </div>
  );
}
