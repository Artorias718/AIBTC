import "./StakingPage.css";
import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";

const TOKENS = [
  {
    name: "AIBTC",
    symbol: "AIBTC",
    address: CONFIG.AIBTC_ADDRESS,
    decimals: 18,
    image: "/aibtc.png",
    stakingContract: CONFIG.AIBTC_STAKING,
    useAaveWrapper: false,
    hasClaim: true,
  },
  {
    name: "USDC",
    symbol: "USDC",
    address: CONFIG.USDC_ADDRESS,
    aTokenAddress: CONFIG.AUSDC_ADDRESS,
    poolAddress: CONFIG.AAVE_USDC_POOL,
    underlyingAsset: CONFIG.USDC_ADDRESS,
    decimals: 6,
    image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    stakingContract: CONFIG.AAVE_USDC_WRAPPER,
    useAaveWrapper: true,
    hasClaim: false,
  },
  {
    name: "USDT",
    symbol: "USDT",
    address: CONFIG.AUSDT_ADDRESS,
    aTokenAddress: CONFIG.AUSDT_ADDRESS,
    poolAddress: CONFIG.AAVE_USDC_POOL,
    underlyingAsset: CONFIG.AUSDT_ADDRESS,
    decimals: 6,
    image: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    stakingContract: CONFIG.AAVE_USDT_WRAPPER,
    useAaveWrapper: true,
    hasClaim: false,
  },
  {
    name: "ETH",
    symbol: "ETH",
    address: CONFIG.WETH_ADDRESS,
    aTokenAddress: CONFIG.aWETH_ADDRESS,
    poolAddress: CONFIG.AAVE_WETH_POOL,
    underlyingAsset: CONFIG.WETH_ADDRESS,
    decimals: 18,
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    stakingContract: CONFIG.AAVE_WETH_WRAPPER,
    useAaveWrapper: true,
    hasClaim: false,
  },
];

const StakingDashboard = () => {
  const { isConnected, account, provider, signer } = useContext(WalletContext);

  const [selectedToken, setSelectedToken] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState("0");
  const [modalMax, setModalMax] = useState("0");

  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  const [walletBalances, setWalletBalances] = useState({});
  const [stakedBalances, setStakedBalances] = useState({});
  const [pendingReward, setPendingReward] = useState({});
  const [apyData, setApyData] = useState({});
  const [globalAPY, setGlobalAPY] = useState("0");

  // -------------------------------
  // UTILITIES
  // -------------------------------
  const getProvider = () =>
    window.ethereum
      ? new ethers.providers.Web3Provider(window.ethereum)
      : new ethers.providers.JsonRpcProvider(
          //"https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j"
          "https://base-sepolia-rpc.publicnode.com",
        );

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

  const waitForAllowance = async (
    tokenContract,
    spender,
    amount,
    retries = 10,
    delay = 2000,
  ) => {
    for (let i = 0; i < retries; i++) {
      const allowance = await tokenContract.allowance(account, spender);
      if (allowance.gte(amount)) return true;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  };

  // -------------------------------
  // EFFECTS
  // -------------------------------
  useEffect(() => {
    fetchGlobalData();
    TOKENS.forEach((token) => {
      fetchTokenApy(token);
      if (account) fetchTokenData(token); // ← token è definito? sì, dovrebbe essere ok
    });
  }, [account]);

  useEffect(() => {
    if (selectedToken && stakeAmount) checkAllowance();
  }, [stakeAmount, selectedToken]);

  // -------------------------------
  // FETCH DATA
  // -------------------------------
  const fetchGlobalData = async () => {
    try {
      const provider = getProvider();
      const stakingContract = new ethers.Contract(
        CONFIG.AIBTC_STAKING,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
        provider,
      );
      const apyRaw = await stakingContract.currentAPY();
      setGlobalAPY((ethers.utils.formatUnits(apyRaw, 18) * 100).toFixed(2));
    } catch (error) {
      console.error("Error fetching global APY", error);
    }
  };

  const fetchTokenData = async (token) => {
    try {
      const provider = getProvider();

      if (token.useAaveWrapper) {
        const aToken = new ethers.Contract(
          token.aTokenAddress,
          ["function balanceOf(address) view returns (uint256)"],
          provider,
        );
        const aBalance = await aToken.balanceOf(account);

        const walletToken = new ethers.Contract(
          token.address,
          ["function balanceOf(address) view returns (uint256)"],
          provider,
        );
        const walletBalance = await walletToken.balanceOf(account);

        setWalletBalances((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(
            walletBalance,
            token.decimals,
          ),
        }));
        setStakedBalances((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(aBalance, token.decimals),
        }));

        if (token.poolAddress && token.underlyingAsset) {
          const poolContract = new ethers.Contract(
            token.poolAddress,
            CONFIG.ABI_AAVE_USDC_POOL,
            provider,
          );
          const reserveData = await poolContract.getReserveData(
            token.underlyingAsset,
          );
          const apy = (
            (Number(reserveData.currentLiquidityRate) / 1e27) *
            100
          ).toFixed(2);
          setApyData((prev) => ({ ...prev, [token.symbol]: `${apy}%` }));
        } else {
          setApyData((prev) => ({ ...prev, [token.symbol]: "APY N/A" }));
        }
      } else {
        const stakingContract = new ethers.Contract(
          token.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          provider,
        );
        const [stakeData, reward] = await Promise.all([
          stakingContract.stakes(account),
          stakingContract.calculateReward(account),
        ]);

        setWalletBalances((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(
            stakeData.amount,
            token.decimals,
          ),
        }));
        setStakedBalances((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(reward, token.decimals),
        }));

        setApyData((prev) => ({
          ...prev,
          [token.symbol]: `${globalAPY}%`,
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${token.symbol}`, error);
    }
  };

  const fetchTokenApy = async (token) => {
    try {
      const provider = getProvider();

      if (token.useAaveWrapper && token.poolAddress && token.underlyingAsset) {
        const poolContract = new ethers.Contract(
          token.poolAddress,
          CONFIG.ABI_AAVE_USDC_POOL,
          provider,
        );
        const reserveData = await poolContract.getReserveData(
          token.underlyingAsset,
        );
        const apy = (
          (Number(reserveData.currentLiquidityRate) / 1e27) *
          100
        ).toFixed(2);
        setApyData((prev) => ({ ...prev, [token.symbol]: `${apy}%` }));
      } else if (!token.useAaveWrapper) {
        // Per token non-Aave puoi usare l'APY globale
        setApyData((prev) => ({ ...prev, [token.symbol]: `${globalAPY}%` }));
      }
    } catch (error) {
      console.error(`Error fetching APY for ${token.symbol}`, error);
      setApyData((prev) => ({ ...prev, [token.symbol]: "-" }));
    }
  };

  // -------------------------------
  // APPROVE / STAKE
  // -------------------------------
  const checkAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        CONFIG.ERC20_ABI,
        //provider,
        signer.provider,
      );
      const allowance = await tokenContract.allowance(
        account,
        selectedToken.stakingContract,
      );
      const amountInWei = stakeAmount
        ? ethers.utils.parseUnits(stakeAmount, selectedToken.decimals)
        : ethers.constants.Zero;
      setIsApproved(allowance.gte(amountInWei));
    } catch (error) {
      console.error("Allowance check failed", error);
    }
  };

  // -------------------------------
  // APPROVE / STAKE
  // -------------------------------
  const handleApprove = async (amount) => {
    const amountToApprove = amount || stakeAmount;

    if (!amountToApprove || parseFloat(amountToApprove) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Approving...");
      setIsTransactionLoading(true);

      const tokenContract = new ethers.Contract(
        selectedToken.address,
        CONFIG.ERC20_ABI,
        signer,
      );

      const amountInWei = ethers.utils.parseUnits(
        amountToApprove,
        selectedToken.decimals,
      );

      const tx = await tokenContract.approve(
        selectedToken.stakingContract,
        amountInWei,
      );
      await tx.wait();

      setTransactionStatus(
        "Approval transaction mined, waiting for allowance...",
      );

      const allowanceConfirmed = await waitForAllowance(
        tokenContract,
        selectedToken.stakingContract,
        amountInWei,
      );

      if (!allowanceConfirmed) {
        setTransactionStatus("Allowance not confirmed after waiting ❌");
        return;
      }

      setTransactionStatus("Approval confirmed ✅");
      setIsApproved(true);

      // Procedi allo staking subito dopo l'approvazione
      await handleStake(amountToApprove);
    } catch (error) {
      console.error(error);
      setTransactionStatus(
        error.code === 4001 ? "Approval rejected by user" : "Approval failed",
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleStake = async (amount) => {
    const amountToStake = amount || stakeAmount;

    if (!amountToStake || parseFloat(amountToStake) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }
    const token = new ethers.Contract(
      selectedToken.address,
      CONFIG.ERC20_ABI,
      signer.provider,
    );

    const bal = await token.balanceOf(account);
    const balFmt = ethers.utils.formatUnits(bal, selectedToken.decimals);

    console.log("Token address:", selectedToken.address);
    console.log("Amount to stake:", amountToStake);
    console.log("WETH balance:", balFmt);

    try {
      setTransactionStatus("Processing stake...");
      setIsTransactionLoading(true);

      const amountInWei = ethers.utils.parseUnits(
        amountToStake,
        selectedToken.decimals,
      );

      if (selectedToken.useAaveWrapper) {
        const aaveContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_WRAPPER,
          signer,
        );
        const tx = await aaveContract.deposit(amountInWei);
        await tx.wait();
      } else {
        const stakingContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          signer,
        );
        const tx = await stakingContract.stake(amountInWei);
        await tx.wait();
      }

      setTransactionStatus("Stake confirmed ✅");
      fetchTokenData(selectedToken); // aggiorna i dati dopo lo stake
    } catch (error) {
      console.error(error);
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

  // -------------------------------
  // WITHDRAW
  // -------------------------------
  const handleWithdraw = async () => {
    if (!modalAmount || parseFloat(modalAmount) <= 0) {
      setTransactionStatus("Enter a valid amount");
      return;
    }

    try {
      setTransactionStatus("Processing withdraw...");
      setIsTransactionLoading(true);

      const amountInWei = ethers.utils.parseUnits(
        modalAmount,
        selectedToken.decimals,
      );

      if (selectedToken.useAaveWrapper) {
        const wrapper = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_WRAPPER,
          signer,
        );

        const token = new ethers.Contract(
          selectedToken.aTokenAddress,
          CONFIG.ERC20_ABI,
          signer,
        );

        // Check allowance
        const currentAllowance = await token.allowance(
          account,
          selectedToken.stakingContract,
        );

        if (currentAllowance.lt(amountInWei)) {
          // Reset to 0 for USDT-style tokens
          if (!currentAllowance.isZero()) {
            const resetTx = await token.approve(
              selectedToken.stakingContract,
              0,
            );
            await resetTx.wait();
          }

          const approveTx = await token.approve(
            selectedToken.stakingContract,
            amountInWei,
          );
          await approveTx.wait();

          const allowanceConfirmed = await waitForAllowance(
            token,
            selectedToken.stakingContract,
            amountInWei,
          );

          if (!allowanceConfirmed) {
            setTransactionStatus("Allowance not confirmed after waiting ❌");
            return;
          }
        }

        setTransactionStatus("Approval confirmed ✅, withdrawing...");
        const tx = await wrapper.withdraw(amountInWei);
        await tx.wait();
      } else {
        const stakingContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          signer,
        );
        const tx = await stakingContract.withdrawPartial(amountInWei);
        await tx.wait();
      }

      setTransactionStatus("Withdraw confirmed ✅");
      setIsWithdrawModalOpen(false);
      fetchTokenData(selectedToken);
    } catch (error) {
      console.error(error);
      const shortMessage =
        error?.error?.data?.message ||
        error?.reason ||
        error?.message?.split("\n")[0] ||
        "Transaction failed";
      setTransactionStatus(
        error?.code === 4001
          ? "Transaction rejected by user"
          : `Withdraw failed: ${shortMessage}`,
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // -------------------------------
  // CLAIM
  // -------------------------------
  const handleClaim = async (token) => {
    try {
      setTransactionStatus("Claiming rewards...");
      setIsTransactionLoading(true);
      const contract = new ethers.Contract(
        token.stakingContract,
        CONFIG.ABI_AIBTC_STAKING_CONCRAT,
        signer,
      );
      const tx = await contract.claim();
      await tx.wait();
      setTransactionStatus("Rewards claimed ✅");
      fetchTokenData(token);
    } catch (error) {
      console.error(error);
      setTransactionStatus("Claim failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const confirmSupply = async () => {
    const amountToStake = modalAmount; // usa direttamente il valore corrente
    setStakeAmount(amountToStake);
    setIsSupplyModalOpen(false);

    if (selectedToken.useAaveWrapper) {
      await handleApprove(amountToStake); // passa l'importo
    } else {
      await handleStake(amountToStake); // passa l'importo
    }
  };

  const confirmWithdraw = async () => {
    setIsWithdrawModalOpen(false); // chiudi subito il modal
    await handleWithdraw(); // poi esegui la transazione
  };

  const openSupplyModal = (token) => {
    setSelectedToken(token);
    const maxAvailable = walletBalances[token.symbol] || "0";
    setModalMax(maxAvailable);
    setModalAmount("0");
    setIsSupplyModalOpen(true);
  };

  const openWithdrawModal = (token) => {
    setSelectedToken(token);
    const maxAvailable = stakedBalances[token.symbol] || "0";
    setModalMax(maxAvailable);
    setModalAmount(maxAvailable);
    setIsWithdrawModalOpen(true);
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="staking-page">
      <div className="container">
        <div className="staking-header">
          <h1>Stake Your Tokens</h1>
          <p>Earn rewards by staking your tokens safely and securely.</p>
        </div>

        <div className="staking-status-section">
          <div className="staking-card-status">
            <div className="staking-row header">
              <div className="cell">Vault</div>
              <div className="cell">APY</div>
              <div className="cell">Deposit</div>
              <div className="cell">Pending Rewards</div>
              <div className="cell actions-cell"></div>
            </div>

            {TOKENS.map((token) => (
              <div key={token.symbol} className="staking-row">
                <div className="cell vault-cell">
                  <img
                    src={token.image}
                    alt={token.symbol}
                    className="vault-token-img"
                  />
                  <span>{token.symbol}</span>
                </div>

                <div className="cell apy-cell">
                  {apyData[token.symbol] || "-"}
                </div>

                <div className="cell deposit-cell">
                  {formatAmount(
                    token.useAaveWrapper
                      ? stakedBalances[token.symbol]
                      : walletBalances[token.symbol],
                  )}
                </div>

                <div className="cell reward-cell">
                  {token.hasClaim
                    ? formatAmount(pendingReward[token.symbol])
                    : "-"}
                </div>

                <div className="cell actions-cell">
                  {token.hasClaim && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleClaim(token)}
                      disabled={
                        isTransactionLoading ||
                        parseFloat(pendingReward[token.symbol] || "0") === 0
                      }
                    >
                      Claim
                    </button>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() => openSupplyModal(token)}
                    disabled={
                      !account ||
                      parseFloat(walletBalances[token.symbol] || "0") === 0
                    }
                  >
                    Stake
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => openWithdrawModal(token)}
                    disabled={
                      !account ||
                      parseFloat(stakedBalances[token.symbol] || "0") === 0
                    }
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}

            {/* Supply & Withdraw modals */}
            {isSupplyModalOpen && selectedToken && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Stake {selectedToken.symbol}</h3>
                  <p className="max-available-text">
                    Max available: {modalMax}
                  </p>

                  <input
                    type="range"
                    min="0"
                    max={modalMax}
                    step="0.01"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max={modalMax}
                    step="0.01"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                  />

                  <div className="modal-buttons">
                    <button className="btn btn-primary" onClick={confirmSupply}>
                      Confirm
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsSupplyModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isWithdrawModalOpen && selectedToken && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Withdraw {selectedToken.symbol}</h3>
                  <p className="max-available-text">
                    Max available: {modalMax}
                  </p>

                  <input
                    type="range"
                    min="0"
                    max={modalMax}
                    step="0.01"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max={modalMax}
                    step="0.01"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                  />

                  <div className="modal-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={confirmWithdraw}
                    >
                      Confirm Withdraw
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsWithdrawModalOpen(false)}
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
        </div>
      </div>
    </div>
  );
};

export default StakingDashboard;
