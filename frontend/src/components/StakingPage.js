import "./StakingPage.css";
import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";
import AIBTCStakingCard from "./AIBTCStakingCard";

/**
 * WRAPPERS ONLY
 * (AIBTC native staking is handled exclusively by <AIBTCStakingCard />)
 *
 * NOTE: I did NOT change any wrapper transaction logic (approve/deposit/withdraw),
 * I only removed the non-wrapper branches and AIBTC-related state/UI.
 */
const TOKENS = [
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
  },
];

const StakingDashboard = () => {
  const { account, signer } = useContext(WalletContext);

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
  const [apyData, setApyData] = useState({});

  // -------------------------------
  // UTILITIES
  // -------------------------------
  const getProvider = () =>
    window.ethereum
      ? new ethers.providers.Web3Provider(window.ethereum)
      : new ethers.providers.JsonRpcProvider(
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
    TOKENS.forEach((token) => {
      fetchTokenApy(token);
      if (account) fetchTokenData(token);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    if (selectedToken && stakeAmount) checkAllowance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeAmount, selectedToken]);

  // -------------------------------
  // FETCH DATA (WRAPPERS ONLY)
  // -------------------------------
  const fetchTokenData = async (token) => {
    try {
      const provider = getProvider();

      // WRAPPER LOGIC (UNCHANGED)
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
        [token.symbol]: ethers.utils.formatUnits(walletBalance, token.decimals),
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
        // const apy = (
        //   (Number(reserveData.currentLiquidityRate) / 1e27) *
        //   100
        // ).toFixed(2);
        //setApyData((prev) => ({ ...prev, [token.symbol]: `${apy}%` }));
      } else {
        setApyData((prev) => ({ ...prev, [token.symbol]: "APY N/A" }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${token.symbol}`, error);
    }
  };

  const fetchTokenApy = async (token) => {
    try {
      const provider = getProvider();

      // WRAPPER APY LOGIC (UNCHANGED)
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
          (Number(reserveData.currentLiquidityRate) / 1e27) * 100 +
          2
        ).toFixed(2);
        setApyData((prev) => ({ ...prev, [token.symbol]: `${apy}%` }));
      } else {
        setApyData((prev) => ({ ...prev, [token.symbol]: "-" }));
      }
    } catch (error) {
      console.error(`Error fetching APY for ${token.symbol}`, error);
      setApyData((prev) => ({ ...prev, [token.symbol]: "-" }));
    }
  };

  // -------------------------------
  // APPROVE / STAKE (WRAPPERS ONLY)
  // -------------------------------
  const checkAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        CONFIG.ERC20_ABI,
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

      // Procedi allo staking subito dopo l'approvazione (UNCHANGED)
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

    try {
      setTransactionStatus("Processing stake...");
      setIsTransactionLoading(true);

      const amountInWei = ethers.utils.parseUnits(
        amountToStake,
        selectedToken.decimals,
      );

      // WRAPPER deposit (UNCHANGED)
      const aaveContract = new ethers.Contract(
        selectedToken.stakingContract,
        CONFIG.ABI_WRAPPER,
        signer,
      );
      const tx = await aaveContract.deposit(amountInWei);
      await tx.wait();

      setTransactionStatus("Stake confirmed ✅");
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
          : `Transaction failed: ${shortMessage}`,
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // -------------------------------
  // WITHDRAW (WRAPPERS ONLY)
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

      // WRAPPER withdraw logic (UNCHANGED)
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
          const resetTx = await token.approve(selectedToken.stakingContract, 0);
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
  // MODALS
  // -------------------------------
  const confirmSupply = async () => {
    const amountToStake = modalAmount;
    setStakeAmount(amountToStake);
    setIsSupplyModalOpen(false);

    // wrappers only
    await handleApprove(amountToStake);
  };

  const confirmWithdraw = async () => {
    setIsWithdrawModalOpen(false);
    await handleWithdraw();
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

        {/* Native AIBTC staking lives here */}
        <AIBTCStakingCard />

        {/* Wrapper vaults */}
        <div className="staking-status-section">
          <div className="staking-card-status">
            <div className="staking-row header">
              <div className="cell">Vault</div>
              <div className="cell">APY</div>
              <div className="cell">Deposit</div>
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
                  {formatAmount(stakedBalances[token.symbol])}
                </div>

                <div className="cell actions-cell">
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

            {/* Supply modal */}
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

            {/* Withdraw modal */}
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
