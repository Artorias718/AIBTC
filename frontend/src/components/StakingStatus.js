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

  // --- Withdraw parziale ---
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [maxStake, setMaxStake] = useState("0");

  const STAKING_ABI = [
    "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim)",
    "function calculateReward(address) view returns (uint256)",
    "function claim() external",
    "function withdrawPartial(uint256 amount) external",
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

  // --- Apri modal per withdraw ---
  const openWithdrawModal = async () => {
    if (!isConnected || !account) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stakingContract = new ethers.Contract(
        stakingAddress,
        STAKING_ABI,
        provider
      );
      const stakeData = await stakingContract.stakes(account);

      const amount = ethers.utils.formatUnits(stakeData.amount, tokenDecimals);
      setMaxStake(amount);
      setWithdrawAmount(amount); // default tutto
      setIsWithdrawModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleWithdrawPartial = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Processing withdraw...");
      setIsTransactionLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const stakingContract = new ethers.Contract(
        stakingAddress,
        STAKING_ABI,
        signer
      );

      const amountInWei = ethers.utils.parseUnits(
        withdrawAmount,
        tokenDecimals
      );
      const tx = await stakingContract.withdrawPartial(amountInWei);
      await tx.wait();

      setTransactionStatus(`Withdraw confirmed ✅ Hash: ${tx.hash}`);
      setIsWithdrawModalOpen(false);
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

  const formatAmount = (value) => {
    if (!value) return "0";

    const num = Number(value);

    // Caso speciale: più piccolo di 0.001
    if (num > 0 && num < 0.001) return "< 0.001";

    // Troncamento a 3 decimali (no arrotondamento)
    const truncated = Math.floor(num * 1000) / 1000;

    let str = truncated.toString();

    // Se non c'è la virgola, restituisco così com'è
    if (!str.includes(".")) return str;

    // Rimuovo SOLO gli zeri dopo la virgola
    str = str.replace(/(\.\d*?[1-9])0+$/, "$1"); // zeri inutili
    str = str.replace(/\.0+$/, ""); // caso ".000"

    return str;
  };

  return (
    <div className="staking-status-section">
      {isLoading ? (
        <p className="loading-text">Loading staking information...</p>
      ) : (
        <div className="staking-card-status">
          <div className="staking-row header">
            <div className="cell">Vault</div>
            <div className="cell">APY</div>
            <div className="cell">Deposit</div>
            <div className="cell">Pending Rewards</div>
            <div className="cell actions-cell"></div>
          </div>

          <div className="staking-row">
            <div className="cell vault-cell">
              <img
                src="/aibtc.png"
                alt="AIBTC Token"
                className="vault-token-img"
              />
              <span>AIBTC</span>
            </div>
            <div className="cell apy-cell">180%</div>
            <div className="cell deposit-cell">
              {formatAmount(stakedAmount)}
            </div>
            <div className="cell reward-cell">
              {formatAmount(pendingReward)}
            </div>

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
                onClick={openWithdrawModal}
                className="btn btn-secondary"
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

      {/* Modal Withdraw Parziale */}
      {isWithdrawModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Withdraw Tokens</h3>
            <p className="max-available-text">Max available: {maxStake}</p>

            <input
              type="range"
              min="0"
              max={maxStake}
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <input
              type="number"
              min="0"
              max={maxStake}
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />

            <div className="modal-buttons">
              <button
                onClick={handleWithdrawPartial}
                className="btn btn-primary"
              >
                Confirm Withdraw
              </button>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
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
