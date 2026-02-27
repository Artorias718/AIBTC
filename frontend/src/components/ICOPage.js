import React, { useState, useEffect, useContext } from "react";
import "./ICOPage.css";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { RiArrowDownWideFill } from "react-icons/ri";
import { CONFIG } from "../config";
import TransakUSDTArbitrum from "./TransakUSDTArbitrum";
import Countdown from "./Countdown";

const tokenAddress = CONFIG.AIBTC_ADDRESS;
const ico = CONFIG.ICO;
const usdt = CONFIG.USDC_ADDRESS;

const ICOPage = () => {
  const [tokensSold, setTokensSold] = useState(0);
  const [totalTokens, setTotalTokens] = useState("5250000");
  const { isConnected, account } = useContext(WalletContext);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [priceUsdc, setPriceUsdc] = useState(null);

  const TOKEN_PRICE = 0.1; // prezzo token in USDT

  const ICO_ABI = [
    "function deposit(uint256 amount) external",
    "function totalDistributedCER() view returns (uint256)",
    "function price_usdc() view returns (uint256)",
  ];

  const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
  ];

  // --- Helper: provider read-only o wallet ---
  const getProvider = () => {
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider(
      "https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j",
    );
  };

  // --- Fetch total supply ---
  const fetchTotalSupply = async () => {
    try {
      const provider = getProvider();
      const ERC20_ABI = ["function totalSupply() view returns (uint256)"];
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider,
      );
      const supply = await tokenContract.totalSupply();
      setTotalTokens(ethers.utils.formatUnits(supply, 18));
    } catch (error) {
      console.error("Errore nel leggere total supply:", error);
    }
  };
  const fetchPrice = async () => {
    try {
      const provider = getProvider();
      const icoContract = new ethers.Contract(ico, ICO_ABI, provider);
      const p = await icoContract.price_usdc(); // uint256
      setPriceUsdc(p);
    } catch (e) {
      console.error("Errore nel leggere price_usdc:", e);
    }
  };
  // --- Fetch tokens sold dinamico ---
  const fetchTokensSold = async () => {
    try {
      const provider = getProvider();
      const icoContract = new ethers.Contract(ico, ICO_ABI, provider);
      const sold = await icoContract.totalDistributedCER();
      setTokensSold(parseFloat(ethers.utils.formatUnits(sold, 18)));
    } catch (error) {
      console.error("Errore nel leggere tokens sold:", error);
    }
  };

  // --- Aggiorna token ricevuti al cambio ---
  useEffect(() => {
    if (!priceUsdc || !usdtAmount) {
      setTokenAmount(0);
      return;
    }

    try {
      const amountInUSDCUnits = ethers.utils.parseUnits(usdtAmount, 6);

      const cerAmount = amountInUSDCUnits
        .mul("100000000000000") // 1e14 (come nel contratto)
        .div(priceUsdc);

      const formatted = ethers.utils.formatUnits(cerAmount, 18);
      setTokenAmount(parseFloat(formatted));
    } catch {
      setTokenAmount(0);
    }
  }, [usdtAmount, priceUsdc]);

  // --- Aggiorna dati globali ---
  useEffect(() => {
    //fetchTotalSupply();
    fetchTokensSold();
    fetchPrice();
    const interval = setInterval(fetchTokensSold, 10000); // refresh ogni 10s
    return () => clearInterval(interval);
  }, []);

  // --- Aggiungi token a MetaMask ---
  const addTokenToMetaMask = async () => {
    const tokenSymbol = "AI Bitcoin";
    const tokenDecimals = 18;
    const tokenImage = "https://aibtc.finance/aibtc.png";
    try {
      if (window.ethereum) {
        const wasAdded = await window.ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage,
            },
          },
        });
        alert(
          wasAdded
            ? "✅ Token aggiunto a MetaMask!"
            : "❌ L'utente ha annullato l'aggiunta del token.",
        );
      } else
        alert("⚠️ MetaMask non rilevato. Installa MetaMask per continuare.");
    } catch (error) {
      console.error("Errore durante l'aggiunta del token:", error);
    }
  };

  // --- Funzione per comprare token ---
  const sendUSTTransaction = async () => {
    if (!isConnected) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    setTransactionStatus("Preparing transaction...");
    setIsTransactionLoading(true);

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();

      const usdtContract = new ethers.Contract(usdt, USDT_ABI, signer);
      const amountInUSDT = ethers.utils.parseUnits(usdtAmount, 6);

      setTransactionStatus("Approving USDT...");
      const approveTx = await usdtContract.approve(ico, amountInUSDT);
      await approveTx.wait();

      setTransactionStatus("Approval confirmed! Depositing...");
      const icoContract = new ethers.Contract(ico, ICO_ABI, signer);
      const tx = await icoContract.deposit(amountInUSDT);
      const receipt = await tx.wait();

      setTransactionStatus(
        receipt.status === 1 ? "Transaction successful!" : "Transaction failed",
      );

      // Aggiorna tokens sold subito dopo la transazione
      fetchTokensSold();
    } catch (error) {
      console.error("Transaction error:", error);

      const shortMessage =
        error?.error?.data?.message ||
        error?.reason ||
        error?.message?.split("\n")[0] ||
        "Transaction failed";

      setTransactionStatus(
        error?.code === 4001
          ? "Transaction rejected by user"
          : `Transaction failed: ${shortMessage}`,
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // --- Formattazione per progress bar ---
  const integerPart = totalTokens.split(".")[0] || "0";
  const formattedWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const progressPercentage =
    totalTokens > 0 ? (tokensSold / totalTokens) * 100 : 0;

  return (
    <div className="ico-page">
      <div className="container">
        {/* Header */}
        <div className="ico-header">
          <h1>Initial Coin Offering (ICO)</h1>
          <p>Join our token sale and become part of the decentralized future</p>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-card">
            <h2>Token Sale Progress</h2>
            <Countdown targetDate="2025-01-31T18:00:00Z" />

            <div className="progress-stats">
              <div className="stat">
                <div className="stat-number">{tokensSold.toLocaleString()}</div>
                <div className="stat-label">Tokens Sold</div>
              </div>
              <div className="stat">
                <div className="stat-number">
                  {formattedWithCommas.toLocaleString()}
                </div>
                <div className="stat-label">Total Supply</div>
              </div>
              <div className="stat">
                <div className="stat-number">
                  {progressPercentage.toFixed(1)}%
                </div>
                <div className="stat-label">Progress</div>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {tokensSold.toLocaleString()} / {totalTokens.toLocaleString()}{" "}
                tokens
              </div>
            </div>
          </div>
        </div>

        {/* Add Token Button */}
        <div
          className="add-token-section"
          style={{ textAlign: "center", margin: "30px 0" }}
        >
          <button
            onClick={addTokenToMetaMask}
            className="btn btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "16px",
              padding: "10px 18px",
              cursor: "pointer",
              borderRadius: "10px",
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
              alt="MetaMask"
              width="24"
              height="24"
            />{" "}
            Add token to MetaMask
          </button>
        </div>

        {/* Swap-like Purchase Section */}
        <div className="purchase-section">
          <div className="swap-card">
            <h3>Buy AIBTC</h3>

            <div className="swap-input">
              <img
                src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
                alt="USDC"
                className="token-icon"
              />
              <input
                type="number"
                placeholder="0.0"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
              />
              <span>USDC</span>
            </div>
            <div className="swap-arrow">
              <RiArrowDownWideFill size={64} color="#3ABBA7" />
            </div>

            <div className="swap-input">
              <img src="/aibtc.png" alt="AI Bitcoin" className="token-icon" />
              <input type="text" value={tokenAmount.toFixed(2)} disabled />
              <span>AIBTC</span>
            </div>

            <button
              onClick={sendUSTTransaction}
              className={`btn btn-primary swap-btn ${
                isTransactionLoading ? "loading" : ""
              }`}
              disabled={!isConnected || !usdtAmount || isTransactionLoading}
            >
              {isTransactionLoading ? "Processing..." : "Buy"}
            </button>

            {transactionStatus && (
              <div
                className={`transaction-status ${
                  transactionStatus.includes("successful") ? "success" : "error"
                }`}
              >
                {transactionStatus}
              </div>
            )}
            <TransakUSDTArbitrum walletAddress={usdt} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICOPage;
