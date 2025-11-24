import "./StakingPage.css";
import { ethers } from "ethers";
import StakingStatus from "./StakingStatus";
import React, { useState, useEffect, useContext } from "react";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";

const tokenAddress = CONFIG.TOKEN_ADDRESS;
const staking = CONFIG.STAKING_ADDRESS;

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

  const STAKING_ABI = ["function stake(uint256 amount) external"];

  const TOKEN_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address owner) public view returns (uint256)",
  ];

  useEffect(() => {
    if (account && stakeAmount) {
      checkAllowance(account);
    }
  }, [stakeAmount, account]);

  const checkAllowance = async (address) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKEN_ABI,
        provider
      );
      const allowance = await tokenContract.allowance(address, staking);

      if (stakeAmount) {
        const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);
        setIsApproved(allowance.gte(amountInWei));
      } else {
        setIsApproved(allowance.gt(0));
      }
    } catch (error) {
      console.error("Error checking allowance:");
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
      const stakingContract = new ethers.Contract(staking, STAKING_ABI, signer);
      const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);
      const tx = await stakingContract.stake(amountInWei);
      //setTransactionStatus(`Transaction sent! Hash: ${tx.hash}`);
      setTransactionStatus(`Transaction sent!`);

      await tx.wait();
      setTransactionStatus(`Transaction confirmed!`);
    } catch (error) {
      console.error("Transaction error:", error);

      // Estrae il messaggio utile inline
      const shortMessage =
        error?.error?.data?.message || // ethers error con data.message
        error?.reason || // ethers error con reason
        error?.message?.split("\n")[0] || // fallback: prima riga
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

  const handleApprove = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Approving...");
      setIsTransactionLoading(true);

      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKEN_ABI,
        signer
      );
      const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);
      const tx = await tokenContract.approve(staking, amountInWei);
      await tx.wait();

      setTransactionStatus("Approval confirmed ✅");
      setIsApproved(true);

      // ✅ Avvio automatico dello staking
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
          stakingAddress={staking}
        />
      </div>
    </div>
  );
};

export default StakingPage;
