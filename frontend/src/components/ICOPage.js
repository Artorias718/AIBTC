import React, { useState, useEffect, useContext } from "react";
import "./ICOPage.css";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { RiArrowDownWideFill } from "react-icons/ri";

const ICOPage = () => {
  const [tokensSold, setTokensSold] = useState(125000);
  const [totalTokens, setTotalTokens] = useState("");
  const { isConnected, account, connectWallet } = useContext(WalletContext);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  const TOKEN_PRICE = 1; // prezzo token in USDT
  const tokenAddress = "0xF69AC4F348Bb34110C1EE53ce7766a83152b75CE";
  const staking = "0x59c2A85Fa8D92864092389041785a735E391949c";
  const ICO_ABI = ["function deposit(uint256 amount) external"];
  const USDT_CONTRACT_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const USDT_ABI = [
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_spender", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
  ];

  const integerPart = totalTokens.split(".")[0];
  const formattedWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const progressPercentage =
    totalTokens > 0 ? (tokensSold / totalTokens) * 100 : 0;

  // Calcola token ricevuti
  useEffect(() => {
    const amount = parseFloat(usdtAmount) || 0;
    setTokenAmount(amount / TOKEN_PRICE);
  }, [usdtAmount]);

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
            : "❌ L'utente ha annullato l'aggiunta del token."
        );
      } else
        alert("⚠️ MetaMask non rilevato. Installa MetaMask per continuare.");
    } catch (error) {
      console.error("Errore durante l'aggiunta del token:", error);
    }
  };

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

      const usdtContract = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        signer
      );
      const amountInUSDT = ethers.utils.parseUnits(usdtAmount, 6);

      setTransactionStatus("Approving USDT...");
      const approveTx = await usdtContract.approve(staking, amountInUSDT);
      await approveTx.wait();

      setTransactionStatus("Approval confirmed! Depositing...");
      const icoContract = new ethers.Contract(staking, ICO_ABI, signer);
      const tx = await icoContract.deposit(amountInUSDT);
      setTransactionStatus(`Deposit sent! Hash: ${tx.hash}...`);
      const receipt = await tx.wait();
      setTransactionStatus(
        receipt.status === 1
          ? `Transaction successful! Hash: ${tx.hash}`
          : "Transaction failed"
      );
    } catch (error) {
      console.error("Transaction error:", error);
      setTransactionStatus(
        error.code === 4001
          ? "Transaction rejected by user"
          : `Transaction failed: ${error.message}`
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const fetchTotalSupply = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        "https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j"
      );
      const ERC20_ABI = ["function totalSupply() view returns (uint256)"];
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      const supply = await tokenContract.totalSupply();
      setTotalTokens(ethers.utils.formatUnits(supply, 18));
    } catch (error) {
      console.error("Errore nel leggere total supply:", error);
    }
  };

  useEffect(() => {
    fetchTotalSupply();
  }, []);

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
                src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                alt="USDT"
                className="token-icon"
              />
              <input
                type="number"
                placeholder="0.0"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
              />
              <span>USDT</span>
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
                  transactionStatus.includes("success") ? "success" : "error"
                }`}
              >
                {transactionStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICOPage;
