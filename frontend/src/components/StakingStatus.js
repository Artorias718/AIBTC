import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./StakingPage.css";
import { CONFIG } from "../config";

const StakingStatus = ({
  account,
  isConnected,
  stakingAddress,
  tokenDecimals = 18,
}) => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const [stakedAmount, setStakedAmount] = useState("0");
  const [pendingReward, setPendingReward] = useState("0");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [usdcAPY, setUsdcAPY] = useState("0");

  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  const [globalAPY, setGlobalAPY] = useState("0");

  // --- Withdraw parziale ---
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [maxStake, setMaxStake] = useState("0");

  // NUOVO: tipo token selezionato nel modal
  const [withdrawType, setWithdrawType] = useState(null);

  const getProvider = () => {
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider(
      "https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j"
    );
  };

  const fetchAIBTCStakeInfo = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stakingContract = new ethers.Contract(
        stakingAddress,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
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

  const fetchUSDCStake = async () => {
    if (!account) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const aTokenContract = new ethers.Contract(
        CONFIG.AUSDC_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );

      const balance = await aTokenContract.balanceOf(account);
      const formatted = ethers.utils.formatUnits(balance, 6);

      setUsdcBalance(formatted);
    } catch (err) {
      console.error("Errore nel fetch dello stake USDC:", err);
    }
  };

  const fetchUSDCAPY = async () => {
    if (!account) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const poolContract = new ethers.Contract(
        CONFIG.AAVE_USDC_POOL, // indirizzo Pool
        CONFIG.ABI_AAVE_USDC_POOL, // ABI minima con getReserveData()
        provider
      );

      const reserveData = await poolContract.getReserveData(
        CONFIG.USDC_ADDRESS
      );
      // currentLiquidityRate è in RAY (1e27)
      const apy = Number(reserveData.currentLiquidityRate) / 1e27;
      const apyPercent = (apy * 100).toFixed(2);

      setUsdcAPY(apyPercent);
    } catch (error) {
      console.error("Errore nel fetch APY USDC:", error);
      setUsdcAPY("0");
    }
  };

  const fetchGlobalData = async () => {
    try {
      const provider = getProvider();
      const stakingContract = new ethers.Contract(
        stakingAddress,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
        provider
      );

      const apyRaw = await stakingContract.currentAPY();
      setGlobalAPY((ethers.utils.formatUnits(apyRaw, 18) * 100).toFixed(2));
    } catch (error) {
      console.error("Error fetching global data:", error);
    }
  };

  const handleClaim = async () => {
    try {
      setTransactionStatus("Claiming rewards...");
      setIsTransactionLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONFIG.AIBTC_STAKING,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
        signer
      );

      const tx = await contract.claim();
      await tx.wait();

      setTransactionStatus("Rewards claimed ✅");
      fetchAIBTCStakeInfo();
    } catch (error) {
      console.error(error);
      setTransactionStatus("Claim failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // ---------------------------------
  //   MODAL AIBTC
  // ---------------------------------
  const openWithdrawModal = async () => {
    if (!isConnected || !account) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stakingContract = new ethers.Contract(
        CONFIG.AIBTC_STAKING,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
        provider
      );

      const stakeData = await stakingContract.stakes(account);
      const amount = ethers.utils.formatUnits(stakeData.amount, tokenDecimals);

      setMaxStake(amount);
      setWithdrawAmount(amount);
      setWithdrawType("AIBTC"); // 🔥 IMPORTANTE
      setIsWithdrawModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------------------------
  //   MODAL USDC
  // ---------------------------------
  const openWithdrawModalUSDC = async () => {
    if (!isConnected || !account) {
      setTransactionStatus("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const aTokenContract = new ethers.Contract(
        CONFIG.AUSDC_ADDRESS,
        ["function balanceOf(address account) view returns (uint256)"],
        provider
      );

      const balance = await aTokenContract.balanceOf(account);
      const amount = ethers.utils.formatUnits(balance, 6);

      setMaxStake(amount);
      setWithdrawAmount(amount);
      setWithdrawType("USDC"); // 🔥 IMPORTANTE
      setIsWithdrawModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------------------------
  //   WITHDRAW AIBTC
  // ---------------------------------
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
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
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
      fetchAIBTCStakeInfo();
    } catch (error) {
      console.error(error);
      setTransactionStatus("Withdraw failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // ---------------------------------
  //   WITHDRAW USDC
  // ---------------------------------
  const handleWithdrawUSDT = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Processing withdraw...");
      setIsTransactionLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const wrapperContract = new ethers.Contract(
        CONFIG.AAVE_USDC_WRAPPER,
        CONFIG.ABI_WRAPPER,
        signer
      );

      const amountInWei = ethers.utils.parseUnits(withdrawAmount, 6);

      const aTokenContract = new ethers.Contract(
        CONFIG.AUSDC_ADDRESS,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        signer
      );

      const approveTx = await aTokenContract.approve(
        CONFIG.AAVE_USDC_WRAPPER,
        amountInWei
      );
      await approveTx.wait();

      setTransactionStatus("Approval confirmed. Withdrawing...");
      // await sleep(5000);

      // Controllo esplicito allowance
      const allowance = await aTokenContract.allowance(
        account,
        CONFIG.AAVE_USDC_WRAPPER
      );

      console.log(allowance);
      if (allowance.lt(amountInWei)) {
        console.log(
          "Allowance non ancora aggiornata, ritento tra 2 secondi..."
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const tx = await wrapperContract.withdraw(amountInWei);
      await tx.wait();

      setTransactionStatus(`Withdraw confirmed ✅ Hash: ${tx.hash}`);
      setIsWithdrawModalOpen(false);

      openWithdrawModalUSDC();
    } catch (error) {
      console.error(error);
      setTransactionStatus("Withdraw failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    if (isConnected && account) {
      fetchAIBTCStakeInfo();
      fetchUSDCStake();
      fetchUSDCAPY(); // APY USDC
    }
  }, [isConnected, account, stakingAddress]);

  const formatAmount = (value) => {
    if (!value) return "0";
    const num = Number(value);
    if (num > 0 && num < 0.001) return "< 0.001";
    const truncated = Math.floor(num * 1000) / 1000;
    let str = truncated.toString();
    if (!str.includes(".")) return str;
    str = str.replace(/(\.\d*?[1-9])0+$/, "$1");
    str = str.replace(/\.0+$/, "");
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

          {/* RIGA AIBTC */}
          <div className="staking-row">
            <div className="cell vault-cell">
              <img
                src="/aibtc.png"
                alt="AIBTC Token"
                className="vault-token-img"
              />
              <span>AIBTC</span>
            </div>
            <div className="cell apy-cell">
              {globalAPY ? `${globalAPY}%` : "loading..."}
            </div>
            <div className="cell deposit-cell">
              {account ? formatAmount(stakedAmount) : "-"}
            </div>
            <div className="cell reward-cell">
              {account ? formatAmount(pendingReward) : "-"}
            </div>
            <div className="cell actions-cell">
              <button
                onClick={handleClaim}
                className="btn btn-secondary"
                disabled={
                  isTransactionLoading ||
                  !account ||
                  parseFloat(pendingReward) === 0
                }
              >
                Claim
              </button>
              <button
                onClick={openWithdrawModal}
                className="btn btn-secondary"
                disabled={
                  isTransactionLoading ||
                  !account ||
                  parseFloat(stakedAmount) === 0
                }
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* RIGA USDT */}
          <div className="staking-row">
            <div className="cell vault-cell">
              <img
                src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
                alt="USDC Token"
                className="vault-token-img"
              />
              <span>USDC</span>
            </div>
            <div className="cell apy-cell">
              {globalAPY ? `${usdcAPY}%` : "loading..."}
            </div>
            <div className="cell deposit-cell">
              {account ? formatAmount(usdcBalance) : "-"}
            </div>
            <div className="cell reward-cell"></div>
            <div className="cell actions-cell">
              <button
                onClick={openWithdrawModalUSDC}
                className="btn btn-secondary"
                disabled={
                  isTransactionLoading ||
                  !account ||
                  parseFloat(usdcBalance) === 0
                }
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Withdraw {withdrawType === "AIBTC" ? "AIBTC" : "USDC"}</h3>
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
                onClick={
                  withdrawType === "AIBTC"
                    ? handleWithdrawPartial
                    : handleWithdrawUSDT
                }
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
