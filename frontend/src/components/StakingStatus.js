import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./StakingPage.css";

const StakingStatus = ({
  account,
  isConnected,
  stakingAddress,
  tokenDecimals = 18,
}) => {
  const [stakedAmount, setStakedAmount] = useState("0");
  const [pendingReward, setPendingReward] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  const STAKING_ABI = [
    "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim, string memory telegramTag)",
    "function calculateReward(address) view returns (uint256)",
    "function claim() external",
    "function withdraw() external",
  ];

  const fetchStakeInfo = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stakingContract = new ethers.Contract(
        stakingAddress,
        STAKING_ABI,
        provider
      );

      const [stakeData, reward] = await Promise.all([
        stakingContract.stakes(account),
        stakingContract.calculateReward(account),
      ]);

      setStakedAmount(
        ethers.utils.formatUnits(stakeData.amount, tokenDecimals)
      );
      setPendingReward(ethers.utils.formatUnits(reward, tokenDecimals));
    } catch (error) {
      console.error("Error fetching stake info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setTransactionStatus("Claiming rewards...");
      setIsTransactionLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(stakingAddress, STAKING_ABI, signer);

      const tx = await contract.claim();
      await tx.wait();

      setTransactionStatus("Rewards claimed ✅");
      fetchStakeInfo();
    } catch (error) {
      console.error(error);
      setTransactionStatus("Claim failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setTransactionStatus("Withdrawing stake...");
      setIsTransactionLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(stakingAddress, STAKING_ABI, signer);

      const tx = await contract.withdraw();
      await tx.wait();

      setTransactionStatus("Withdraw completed ✅");
      fetchStakeInfo();
    } catch (error) {
      console.error(error);
      setTransactionStatus("Withdraw failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      fetchStakeInfo();
    }
  }, [isConnected, account]);

  return (
    <div className="staking-status-section">
      <h2 className="staking-status-title"></h2>

      {isLoading ? (
        <p className="loading-text">Loading staking information...</p>
      ) : (
        <div className="staking-card-status">
          {/* Header */}
          <div className="staking-row header">
            <div className="cell">Vault</div>
            <div className="cell">APY</div>
            <div className="cell">Deposit</div>
            <div className="cell">Pending Rewards</div>
            <div className="cell actions-cell"></div>
          </div>

          {/* Riga dati */}
          <div className="staking-row">
            <div className="cell vault-cell">
              <img
                src="/aibtc.png" // sostituisci con il percorso corretto
                alt="AIBTC Token"
                className="vault-token-img"
              />
              <span>AIBTC</span>
            </div>
            <div className="cell apy-cell">180%</div>
            <div className="cell deposit-cell">{stakedAmount} </div>
            <div className="cell reward-cell">{pendingReward} </div>
            <div className="cell actions-cell">
              <button
                onClick={handleClaim}
                className="btn btn-secondary"
                disabled={
                  isTransactionLoading || parseFloat(pendingReward) === 0
                }
              >
                Claim
              </button>
              <button
                onClick={handleWithdraw}
                className="btn btn-secondary "
                disabled={
                  isTransactionLoading || parseFloat(stakedAmount) === 0
                }
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionStatus && (
        <div
          className={`transaction-status ${
            transactionStatus.includes("failed") ? "error" : "success"
          }`}
        >
          {transactionStatus}
        </div>
      )}
    </div>
  );
};

export default StakingStatus;
