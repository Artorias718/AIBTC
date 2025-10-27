import React, { useState, useEffect } from "react";
import "./StakingPage.css";
import { ethers } from "ethers";

const StakingPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsConnected(true);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setTransactionStatus("Error connecting wallet");
      }
    } else {
      setTransactionStatus(
        "MetaMask is not installed. Please install MetaMask."
      );
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
      const STAKING_CONTRACT_ADDRESS = "0xYourStakingContractAddress";
      const STAKING_ABI = ["function stake(uint256 amount) public"];

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        signer
      );

      // Convert amount to wei (assuming token has 18 decimals)
      const amountInWei = ethers.utils.parseUnits(stakeAmount, 18);

      const tx = await stakingContract.stake(amountInWei);
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
              <button
                onClick={() => setIsConnected(false)}
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
            onClick={handleStake}
            className={`btn btn-primary btn-large stake-btn ${
              isTransactionLoading ? "loading" : ""
            }`}
            disabled={!isConnected || !stakeAmount || isTransactionLoading}
          >
            {isTransactionLoading ? "Processing..." : "Stake Tokens"}
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

        <div className="info-section">
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
        </div>
      </div>
    </div>
  );
};

export default StakingPage;
