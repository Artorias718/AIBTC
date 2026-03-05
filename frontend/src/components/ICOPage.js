import React, { useState, useEffect, useContext, useMemo } from "react";
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

const READ_RPC = CONFIG.READ_RPC;

const ICO_ABI = [
  "function deposit(uint256 amount) external",
  "function totalDistributedCER() view returns (uint256)",
  "function price_usdc() view returns (uint256)",
];

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];

const ICOPage = () => {
  const [tokensSold, setTokensSold] = useState(0);
  const [totalTokens, setTotalTokens] = useState("5250000");
  const { isConnected } = useContext(WalletContext);

  const [transactionStatus, setTransactionStatus] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [priceUsdc, setPriceUsdc] = useState(null);

  // ✅ Provider READ sempre disponibile
  const readProvider = useMemo(() => {
    return new ethers.providers.JsonRpcProvider(READ_RPC);
  }, []);

  // --- Fetch total supply (opzionale) ---
  const fetchTotalSupply = async () => {
    try {
      const ERC20_ABI = ["function totalSupply() view returns (uint256)"];
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        readProvider,
      );
      const supply = await tokenContract.totalSupply();
      setTotalTokens(ethers.utils.formatUnits(supply, 18));
    } catch (error) {
      console.error("Errore nel leggere total supply:", error);
    }
  };

  const fetchPrice = async () => {
    try {
      const icoContract = new ethers.Contract(ico, ICO_ABI, readProvider);
      const p = await icoContract.price_usdc();
      setPriceUsdc(p);
    } catch (e) {
      console.error("Errore nel leggere price_usdc:", e);
      setPriceUsdc(null);
    }
  };

  const fetchTokensSold = async () => {
    try {
      const icoContract = new ethers.Contract(ico, ICO_ABI, readProvider);
      const sold = await icoContract.totalDistributedCER();
      const soldFormatted = parseFloat(ethers.utils.formatUnits(sold, 18));
      setTokensSold(soldFormatted + 115283);
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
        .mul("100000000000000") // 1e14
        .div(priceUsdc);

      const formatted = ethers.utils.formatUnits(cerAmount, 18);
      setTokenAmount(parseFloat(formatted));
    } catch {
      setTokenAmount(0);
    }
  }, [usdtAmount, priceUsdc]);

  // --- Aggiorna dati globali SEMPRE (anche senza MetaMask) ---
  useEffect(() => {
    // fetchTotalSupply(); // se ti serve, riattivalo
    fetchTokensSold();
    fetchPrice();

    const interval = setInterval(() => {
      fetchTokensSold();
      // se vuoi anche il prezzo aggiornato:
      // fetchPrice();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readProvider]);

  // --- Aggiungi token a MetaMask ---
  const addTokenToMetaMask = async () => {
    const tokenSymbol = "AIBTC";
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
      } else {
        alert("⚠️ MetaMask non rilevato. Installa MetaMask per continuare.");
      }
    } catch (error) {
      console.error("Errore durante l'aggiunta del token:", error);
    }
  };

  // --- Compra token (WRITE solo con MetaMask) ---
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
      if (!window.ethereum) {
        setTransactionStatus("MetaMask not found");
        return;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();

      const usdtContract = new ethers.Contract(usdt, USDT_ABI, signer);
      const amountInUSDT = ethers.utils.parseUnits(usdtAmount, 6);

      setTransactionStatus("Approving USDC...");
      const approveTx = await usdtContract.approve(ico, amountInUSDT);
      await approveTx.wait();

      setTransactionStatus("Approval confirmed! Depositing...");
      const icoContract = new ethers.Contract(ico, ICO_ABI, signer);
      const tx = await icoContract.deposit(amountInUSDT);
      const receipt = await tx.wait();

      setTransactionStatus(
        receipt.status === 1 ? "Transaction successful!" : "Transaction failed",
      );

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

  // --- Progress bar ---
  const integerPart = String(totalTokens).split(".")[0] || "0";
  const formattedWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const totalTokensNum = Number(totalTokens) || 0;
  const progressPercentage =
    totalTokensNum > 0 ? (tokensSold / totalTokensNum) * 100 : 0;

  return (
    <div className="ico-page">
      <div className="container">
        <div className="ico-header">
          <h1>Initial Coin Offering (ICO)</h1>
          <p>Join our token sale and become part of the decentralized future</p>
        </div>

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
                <div className="stat-number">{formattedWithCommas}</div>
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
                {tokensSold.toLocaleString()} /{" "}
                {totalTokensNum.toLocaleString()} tokens
              </div>
            </div>
          </div>
        </div>

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

        <div className="purchase-section">
          <div className="swap-card">
            <h3>Buy AIBTC</h3>

            <div className="swap-input">
              <img src="/usdc.png" alt="USDC" className="token-icon" />
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
