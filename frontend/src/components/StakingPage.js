import "./StakingPage.css";
import { ethers } from "ethers";
import StakingStatus from "./StakingStatus";
import React, { useState, useEffect, useContext } from "react";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";

const STAKING_ABI = ["function stake(uint256 amount) external"];
const AAVE_WRAPPER_ABI = ["function deposit(uint256 amount) external"];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)",
];

const TOKENS = [
  {
    name: "AIBTC",
    symbol: "AIBTC",
    address: CONFIG.TOKEN_ADDRESS,
    decimals: 18,
    image: "/aibtc.png",
    stakingContract: CONFIG.STAKING_ADDRESS,
    useAaveWrapper: false,
  },
  {
    name: "USDC",
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    decimals: 6,
    image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    stakingContract: CONFIG.AAVE_STAKING, // AaveWrapper
    useAaveWrapper: true,
  },
  {
    name: "BTC",
    symbol: "BTC",
    address: "0x0000000000000000000000000000000000000002",
    decimals: 18,
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    stakingContract: CONFIG.STAKING_ADDRESS,
    useAaveWrapper: false,
  },
];

const StakingPage = () => {
  const {
    isConnected,
    account,
    connectWallet,
    disconnectWallet,
    provider,
    signer,
  } = useContext(WalletContext);

  const [stakeAmount, setStakeAmount] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    if (account && stakeAmount) {
      checkAllowance(account);
    }
  }, [stakeAmount, account, selectedToken]);

  const checkAllowance = async (address) => {
    try {
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        TOKEN_ABI,
        provider
      );
      const allowance = await tokenContract.allowance(
        address,
        selectedToken.stakingContract
      );

      if (stakeAmount) {
        const amountInWei = ethers.utils.parseUnits(
          stakeAmount,
          selectedToken.decimals
        );
        setIsApproved(allowance.gte(amountInWei));
      } else {
        setIsApproved(allowance.gt(0));
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
    }
  };

  const handleApprove = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Approving...");
      setIsTransactionLoading(true);

      const tokenContract = new ethers.Contract(
        selectedToken.address,
        TOKEN_ABI,
        signer
      );
      const amountInWei = ethers.utils.parseUnits(
        stakeAmount,
        selectedToken.decimals
      );

      const tx = await tokenContract.approve(
        selectedToken.stakingContract,
        amountInWei
      );
      await tx.wait();

      setTransactionStatus("Approval confirmed ✅");
      setIsApproved(true);

      setTransactionStatus("Approval confirmed, starting stake...");
      await handleStake();
    } catch (error) {
      console.error(error);
      if (error.code === 4001) {
        setTransactionStatus("Approval rejected by user");
      } else {
        setTransactionStatus("Approval failed");
      }
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setTransactionStatus("Please enter a valid amount");
      return;
    }

    setTransactionStatus("Preparing transaction...");
    setIsTransactionLoading(true);

    try {
      const amountInWei = ethers.utils.parseUnits(
        stakeAmount,
        selectedToken.decimals
      );

      if (selectedToken.useAaveWrapper) {
        const aaveContract = new ethers.Contract(
          selectedToken.stakingContract,
          AAVE_WRAPPER_ABI,
          signer
        );
        const tx = await aaveContract.deposit(amountInWei);
        setTransactionStatus("Transaction sent!");
        await tx.wait();
        setTransactionStatus("Transaction confirmed!");
      } else {
        const stakingContract = new ethers.Contract(
          selectedToken.stakingContract,
          STAKING_ABI,
          signer
        );
        const tx = await stakingContract.stake(amountInWei);
        setTransactionStatus("Transaction sent!");
        await tx.wait();
        setTransactionStatus("Transaction confirmed!");
      }
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
          : `Transaction failed: ${shortMessage}`
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="staking-page">
      <div className="container">
        <div className="staking-header">
          <h1>Stake Your Tokens</h1>
          <p>Earn rewards by staking your tokens safely and securely.</p>
        </div>

        <div className="staking-card">
          {isConnected ? (
            <div className="wallet-connected">
              <div className="wallet-info">
                <span className="wallet-icon">🔗</span>
                <span className="wallet-address">{formatAddress(account)}</span>
              </div>
              <button onClick={disconnectWallet} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="btn btn-primary btn-large"
            >
              Connect Wallet
            </button>
          )}

          <div className="amount-input-section">
            <label htmlFor="stakeAmount">Enter Amount to Stake:</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                position: "relative",
              }}
            >
              <div
                className="token-selector"
                onClick={() => setShowTokens(!showTokens)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "8px 12px",
                  border: "1px solid #444",
                  borderRadius: "10px",
                  background: "#1a1a1a",
                }}
              >
                <img
                  src={selectedToken.image}
                  alt={selectedToken.symbol}
                  width={26}
                  height={26}
                />
                <span>{selectedToken.symbol}</span>
              </div>

              {showTokens && (
                <div
                  className="token-dropdown"
                  style={{
                    position: "absolute",
                    top: "48px",
                    left: "0",
                    background: "#222",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #333",
                    zIndex: 100,
                    width: "180px",
                  }}
                >
                  {TOKENS.map((t) => (
                    <div
                      key={t.address}
                      className="token-dropdown-item"
                      onClick={() => {
                        setSelectedToken(t);
                        setShowTokens(false);
                        setIsApproved(false);
                        setStakeAmount("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px",
                        cursor: "pointer",
                        borderRadius: "6px",
                      }}
                    >
                      <img
                        src={t.image}
                        alt={t.symbol}
                        width={22}
                        height={22}
                      />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="number"
                id="stakeAmount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.01"
                className="amount-input"
              />
            </div>
          </div>

          <button
            onClick={
              selectedToken.symbol === "USDC"
                ? handleApprove
                : isApproved
                ? handleStake
                : handleApprove
            }
            className={`btn btn-primary btn-large ${
              isTransactionLoading ? "loading" : ""
            }`}
            disabled={isTransactionLoading}
          >
            {isTransactionLoading
              ? "Processing..."
              : selectedToken.symbol === "USDC"
              ? "Approve & Stake"
              : isApproved
              ? "Stake Tokens"
              : "Approve Token"}
          </button>

          {transactionStatus && (
            <div
              className={`transaction-status ${
                transactionStatus.includes("confirmed") ? "success" : "error"
              }`}
            >
              {transactionStatus}
            </div>
          )}
        </div>

        <StakingStatus
          account={account}
          isConnected={isConnected}
          stakingAddress={selectedToken.stakingContract}
        />
      </div>
    </div>
  );
};

export default StakingPage;
