import React, { useState, useEffect } from "react";
import { useContext } from "react";
import "./ICOPage.css";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";

const ICOPage = () => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [tokensSold, setTokensSold] = useState(125000); // Example: 125,000 tokens sold
  const [totalTokens, setTotalTokens] = useState("");
  const { isConnected, account, connectWallet } = useContext(WalletContext);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [dollarAmount, setDollarAmount] = useState("");
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const integerPart = totalTokens.split(".")[0]; // prende solo la parte intera
  const formattedWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const progressPercentage =
    totalTokens > 0 ? (tokensSold / totalTokens) * 100 : 0;

  const tokenAddress = "0x7af07eA4914cA38047fdf27c233E1FcA7B8A4852";
  const staking = "0x70d3F5026Fc740C70D92B3386c7A95b794cE3C66"; //in raltà non è staking ma ICO.sol

  const ICO_ABI = ["function deposit(uint256 amount) external"];

  const tiers = [
    {
      id: 1,
      name: "Shrimp",
      price: 1.0,
      minPurchase: 20,
      maxPurchase: 1000,
      description:
        "Perfect for early supporters. Get started with our most accessible tier.",
      color: "#22c55e",
      icon: "🦐",
    },
    {
      id: 2,
      name: "Tuna",
      price: 0.8,
      minPurchase: 1000,
      maxPurchase: 5000,
      description:
        "For active community members. Enjoy exclusive benefits and support.",
      color: "#16a34a",
      icon: "🐟",
    },
    {
      id: 3,
      name: "Whale",
      price: 0.6,
      minPurchase: 5000,
      maxPurchase: 50000,
      description:
        "For large investors. Get premium support and priority access.",
      color: "#15803d",
      icon: "🐋",
    },
  ];

  const addTokenToMetaMask = async () => {
    const tokenAddress = "0x7af07eA4914cA38047fdf27c233E1FcA7B8A4852"; // tuo token
    const tokenSymbol = "AI Bitcoin"; // simbolo del token
    const tokenDecimals = 18; // decimali
    const tokenImage = "https://aibtc.finance/aibtc.png"; // URL logo (opzionale)

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

        if (wasAdded) {
          alert("✅ Token aggiunto a MetaMask!");
        } else {
          alert("❌ L'utente ha annullato l'aggiunta del token.");
        }
      } else {
        alert("⚠️ MetaMask non rilevato. Installa MetaMask per continuare.");
      }
    } catch (error) {
      console.error("Errore durante l'aggiunta del token:", error);
    }
  };

  const sendUSTTransaction = async () => {
    if (!isConnected) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }

    if (!selectedTier || !dollarAmount) {
      setTransactionStatus("Please enter a valid amount first");
      return;
    }

    setTransactionStatus("Preparing transaction...");
    setIsTransactionLoading(true);

    try {
      // USDT contract address on Ethereum mainnet
      // const USDT_CONTRACT_ADDRESS =
      //   "0xdAC17F958D2ee523a2206206994597C13D831ec7";

      const USDT_CONTRACT_ADDRESS =
        "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
      // USDT contract ABI (minimal for transfer function)
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

      // Get the provider and signer
      const ethers = require("ethers");
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();

      // Create contract instance
      const usdtContract = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        signer
      );

      // Convert dollar amount to USDT (USDT has 6 decimals)
      const amountInUSDT = ethers.utils.parseUnits(dollarAmount, 6);

      // Resolve ENS name to address or use fallback
      // let finalRecipientAddress;
      // try {
      //   finalRecipientAddress = await web3Provider.resolveName("cerdao.eth");
      //   if (!finalRecipientAddress) {
      //     // Fallback to direct address if ENS resolution fails
      //     finalRecipientAddress = staking;
      //     setTransactionStatus(
      //       "ENS resolution failed, using fallback address..."
      //     );
      //   }
      // } catch (error) {
      //   console.warn("ENS resolution failed:", error);
      //   // Use fallback address
      //   finalRecipientAddress = staking;
      //   setTransactionStatus("Using fallback address for cerdao.eth...");
      // }

      setTransactionStatus("Approving USDT...");

      // 1️⃣ ********************** DEPOSIT
      const approveTx = await usdtContract.approve(staking, amountInUSDT);
      await approveTx.wait();
      setTransactionStatus("Approval confirmed! Now calling deposit...");
      // // Send the transaction
      // const tx = await usdtContract.transfer(
      //   finalRecipientAddress,
      //   amountInUSDT
      // );
      //

      // setTransactionStatus(
      //   `Transaction sent! Hash: ${tx.hash}. Waiting for confirmation...`
      // );

      // 2 ********************** DEPOSIT
      const icoContract = new ethers.Contract(staking, ICO_ABI, signer);
      const tx = await icoContract.deposit(amountInUSDT);
      setTransactionStatus(
        `Deposit sent! Hash: ${tx.hash}. Waiting for confirmation...`
      );
      await tx.wait();
      setTransactionStatus(`Deposit confirmed!`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTransactionStatus(`Transaction successful! Hash: ${tx.hash}`);
      } else {
        setTransactionStatus("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Transaction error:", error);

      if (error.code === 4001) {
        setTransactionStatus("Transaction rejected by user");
      } else if (error.message.includes("insufficient funds")) {
        setTransactionStatus("Insufficient USDT balance");
      } else if (error.message.includes("User denied")) {
        setTransactionStatus("Transaction denied by user");
      } else {
        setTransactionStatus(`Transaction failed: ${error.message}`);
      }
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const calculateTokens = (ustAmount) => {
    if (!selectedTier) return 0;
    const tokens = ustAmount / selectedTier.price;
    return Math.floor(tokens);
  };

  const selectTierByAmount = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSelectedTier(null);
      return;
    }

    // Find the appropriate tier based on amount
    let appropriateTier = null;

    // Check tiers in reverse order (highest to lowest) to get the best price
    for (let i = tiers.length - 1; i >= 0; i--) {
      const tier = tiers[i];
      if (numAmount >= tier.minPurchase && numAmount <= tier.maxPurchase) {
        appropriateTier = tier;
        break;
      }
    }

    // If amount is below minimum of any tier, select the first tier (no minimum limit)
    if (!appropriateTier) {
      appropriateTier = tiers[0];
    }

    setSelectedTier(appropriateTier);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setDollarAmount(value);
    selectTierByAmount(value);
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const fetchTotalSupply = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        "https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j"
      ); // fallback RPC
      const ERC20_ABI = ["function totalSupply() view returns (uint256)"];

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      const supply = await tokenContract.totalSupply();

      // I token ERC20 solitamente hanno 18 decimali
      const formattedSupply = ethers.utils.formatUnits(supply, 18); // stringa, precisione piena
      setTotalTokens(formattedSupply);
    } catch (error) {
      console.error("Errore nel leggere total supply:", error);
      //setTotalTokens(200000); // fallback se c'è un errore
    }
  };

  fetchTotalSupply();

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
        {/* Wallet Connection */}
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-connected">
              <div className="wallet-info">
                <span className="wallet-icon">🔗</span>
                <span className="wallet-address">{formatAddress(account)}</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="btn btn-primary btn-large"
            >
              Connect Wallet to Participate
            </button>
          )}
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
            />
            Add token to MetaMask
          </button>
        </div>

        {/* Tiers Section */}
        <div className="tiers-section">
          <h2>Choose Your Investment Tier</h2>
          <div className="tiers-grid">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`tier-card ${
                  selectedTier?.id === tier.id ? "selected" : ""
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="tier-header">
                  <div className="tier-icon">{tier.icon}</div>
                  <h3>{tier.name}</h3>
                </div>
                <div className="tier-price">
                  <span className="price-amount">${tier.price}</span>
                  <span className="price-label">per token</span>
                </div>
                <div className="tier-limits">
                  <div className="limit">
                    <span>Min:</span> ${tier.minPurchase.toLocaleString()}
                  </div>
                  <div className="limit">
                    <span>Max:</span> ${tier.maxPurchase.toLocaleString()}
                  </div>
                </div>
                <p className="tier-description">{tier.description}</p>
                <div className="tier-selector">
                  {selectedTier?.id === tier.id ? (
                    <div className="selected-indicator">✓ Selected</div>
                  ) : (
                    <div className="select-indicator">Select Tier</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Purchase Section */}
        <div className="purchase-section">
          <div className="purchase-card">
            <h3>Purchase Tokens</h3>

            {/* Amount Input */}
            <div className="amount-input-section">
              <label htmlFor="dollarAmount">Enter Amount (USD):</label>
              <div className="input-group">
                <span className="input-prefix"></span>
                <input
                  type="number"
                  id="dollarAmount"
                  value={dollarAmount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount..."
                  min="0"
                  step="0.01"
                  className="amount-input"
                />
              </div>
            </div>

            {selectedTier && (
              <>
                <div className="purchase-details">
                  <div className="detail-row">
                    <span>Selected Tier:</span>
                    <span className="tier-name">{selectedTier.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Price per Token:</span>
                    <span>${selectedTier.price}</span>
                  </div>
                  <div className="detail-row">
                    <span>Amount:</span>
                    <span>${parseFloat(dollarAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Tokens You'll Receive:</span>
                    <span className="token-amount">
                      {calculateTokens(
                        parseFloat(dollarAmount || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="transaction-section">
              <div className="transaction-info">
                <h4>Send USDT to:</h4>
                <div className="recipient-address">
                  <span className="address">cerdao.eth</span>
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText("cerdao.eth")}
                  >
                    📋
                  </button>
                </div>
              </div>

              <button
                onClick={sendUSTTransaction}
                className={`btn btn-primary btn-large purchase-btn ${
                  isTransactionLoading ? "loading" : ""
                }`}
                disabled={
                  !isConnected ||
                  !selectedTier ||
                  !dollarAmount ||
                  isTransactionLoading
                }
              >
                {isTransactionLoading
                  ? "Processing..."
                  : !isConnected
                  ? "Connect Wallet First"
                  : !selectedTier
                  ? "Enter Valid Amount"
                  : "Send USDT Transaction"}
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

        {/* Info Section */}
        <div className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">⚠️</div>
              <h3>Risk Warning</h3>
              <p>
                Cryptocurrency investments are highly volatile and risky. Only
                invest what you can afford to lose.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3>Security</h3>
              <p>
                All transactions are secured by blockchain technology. Your
                funds are safe and transparent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICOPage;
