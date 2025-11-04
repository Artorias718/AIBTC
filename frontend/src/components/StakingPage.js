import "./StakingPage.css";
import { ethers } from "ethers";
import StakingStatus from "./StakingStatus";
import React, { useState, useEffect, useContext } from "react";
import { WalletContext } from "./WalletContext";
import { encryptTelegramTag } from "../utils/encryption";

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
  const [telegramTag, setTelegramTag] = useState(""); // 👈 nuovo

  const STAKING_CONTRACT_ADDRESS = "0x3e4E80b498B4ccF9bd058e58DcFe78d38Da65799";
  const TOKEN_ADDRESS = "0x7af07eA4914cA38047fdf27c233E1FcA7B8A4852";

  const STAKING_ABI = [
    "function stake(uint256 amount, string calldata _telegramTag) external",
  ];

  const TOKEN_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address owner) public view returns (uint256)",
  ];

  useEffect(() => {
    if (account && stakeAmount) {
      checkAllowance(account);
    }
  }, [stakeAmount]);

  const checkAllowance = async (address) => {
    try {
      const activeProvider = provider;
      const activeSigner = signer;
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TOKEN_ABI,
        activeProvider
      );
      const allowance = await tokenContract.allowance(
        address,
        STAKING_CONTRACT_ADDRESS
      );

      if (stakeAmount) {
        const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);
        setIsApproved(allowance.gte(amountInWei));
      } else {
        setIsApproved(allowance.gt(0));
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
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
      const activeProvider = provider;
      const activeSigner = signer;
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        activeSigner
      );

      // Convert amount to wei (assuming token has 18 decimals)
      const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);
      const encryptedTag = encryptTelegramTag(telegramTag);

      const tx = await stakingContract.stake(amountInWei, encryptedTag || "");
      setTransactionStatus(`Transaction sent! Hash: ${tx.hash}`);
      await tx.wait();
      setTransactionStatus(`Transaction confirmed! Hash: ${tx.hash}`);
    } catch (error) {
      console.error(error);
      if (error.code === 4001) {
        setTransactionStatus("Transaction rejected by user");
      } else {
        setTransactionStatus(`Transaction failed: ${error.message}`);
      }
    } finally {
      setIsTransactionLoading(false);
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
      const activeProvider = provider;
      const activeSigner = signer;
      const cerContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TOKEN_ABI,
        activeSigner
      );
      const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);

      console.log("DEBUG signer:", signer);
      console.log("DEBUG provider:", provider);
      console.log("DEBUG account:", account);

      const tx = await cerContract.approve(
        STAKING_CONTRACT_ADDRESS,
        amountInWei
      );
      await tx.wait();

      setTransactionStatus("Approval confirmed ✅");
      setIsApproved(true);
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
            <div className="input-group">
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
            {/* ✅ Campo Telegram opzionale */}
            <div className="telegram-input-section">
              <label htmlFor="telegramTag">Telegram Tag (optional):</label>
              <div className="input-group">
                <input
                  type="text"
                  id="telegramTag"
                  value={telegramTag}
                  onChange={(e) => setTelegramTag(e.target.value)}
                  placeholder="@username"
                  className="amount-input"
                />
              </div>
            </div>
            <small className="telegram-note">
              Note: the tag will be safely encrypted for your privacy and is
              used to receive trading signals
            </small>
          </div>

          <button
            onClick={isApproved ? handleStake : handleApprove}
            className={`btn btn-primary btn-large ${
              isTransactionLoading ? "loading" : ""
            }`}
            disabled={isTransactionLoading}
          >
            {isTransactionLoading
              ? "Processing..."
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
          stakingAddress={STAKING_CONTRACT_ADDRESS}
        />

        {/* <div className="info-section">
          <h2>Important Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">⚠️</div>
              <h3>Risk Warning</h3>
              <p>
                Staking involves smart contract interactions and potential
                risks. Stake only what you can afford to lose.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3>Security</h3>
              <p>
                All staking transactions are secured by blockchain technology.
                Your funds remain safe.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default StakingPage;
