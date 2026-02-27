import React, { useEffect, useMemo, useState, useContext } from "react";
import "./AdminDashboard.css";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";

// ======================
// Addresses
// ======================
const TOKEN_ADDRESS = CONFIG.AIBTC_ADDRESS;
const ICO_ADDRESS = CONFIG.ICO;
const STAKING_ADDRESS = CONFIG.AIBTC_STAKING; // ✅ staking contract address

// ======================
// ABIs
// ======================
const TOKEN_ABI = [
  // ERC20
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",

  // Ownable
  "function owner() view returns (address)",

  // Fees
  "function feeBasisPoints() view returns (uint256)",
  "function MAX_FEE_BPS() view returns (uint256)",
  "function feeCollector() view returns (address)",
  "function feeEnabled() view returns (bool)",
  "function isFeeExempt(address) view returns (bool)",

  // Trading
  "function tradingEnabled() view returns (bool)",
  "function tradingPermanentlyEnabled() view returns (bool)",
  "function isTradingExempt(address) view returns (bool)",

  // Writes
  "function enableTrading() external",
  "function setTradingExempt(address account, bool exempt) external",
  "function setFee(uint256 _bps) external",
  "function setFeeCollector(address _collector) external",
  "function setFeeExempt(address account, bool exempt) external",
  "function setFeeEnabled(bool enabled) external",
  "function burn(uint256 amount) external",
  "function mint(address to, uint256 amount) external",
];

const ICO_ABI = [
  // OwnableUpgradeable
  "function owner() view returns (address)",

  // Reads
  "function usdc() view returns (address)",
  "function aibtc() view returns (address)",
  "function saleActive() view returns (bool)",
  "function price_usdc() view returns (uint256)",
  "function totalDepositedusdc() view returns (uint256)",
  "function totalDistributedCER() view returns (uint256)",

  // Writes (onlyOwner)
  "function setPrice(uint256 newPrice) external",
  "function startSale() external",
  "function stopSale() external",
  "function withdrawUSDC(uint256 amount) external",
  "function withdrawCER(uint256 amount) external",
];

const STAKING_ABI = [
  // OwnableUpgradeable
  "function owner() view returns (address)",

  // PausableUpgradeable
  "function paused() view returns (bool)",
  "function pause() external",
  "function unpause() external",

  // Reads
  "function cerToken() view returns (address)",
  "function totalStakedAmount() view returns (uint256)",
  "function annualRewardBudget() view returns (uint256)",
  "function rewardRatePerSecondGlobal() view returns (uint256)",
  "function currentAPY() view returns (uint256)",
  "function contractBalance() view returns (uint256)",

  // ✅ New in updated staking
  "function rewardsEnd() view returns (uint256)",
  "function rewardsActive() view returns (bool)",
  "function restartRewards(uint256 newAnnualBudget) external",

  // User reads
  "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim, uint256 unclaimed)",
  "function calculateReward(address staker) view returns (uint256)",

  // Owner write (still exists)
  "function setAnnualRewardBudget(uint256 _annualRewardBudget) external",
];

const ERC20_ABI_MIN = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const AdminDashboard = () => {
  const {
    isConnected,
    account,
    provider,
    signer,
    chainId,
    isCorrectNetwork,
    switchNetwork,
  } = useContext(WalletContext);

  // ======================
  // Common UI state
  // ======================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [txStatus, setTxStatus] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  // ======================
  // Token read state
  // ======================
  const [tName, setTName] = useState("-");
  const [tSymbol, setTSymbol] = useState("-");
  const [tDecimals, setTDecimals] = useState(18);
  const [tTotalSupply, setTTotalSupply] = useState("0");

  const [tOwner, setTOwner] = useState(null);
  const [tFeeBps, setTFeeBps] = useState(0);
  const [tMaxFeeBps, setTMaxFeeBps] = useState(0);
  const [tFeeCollector, setTFeeCollector] = useState(null);
  const [tFeeEnabled, setTFeeEnabled] = useState(false);

  const [tTradingEnabled, setTTradingEnabled] = useState(false);
  const [tTradingPermanentlyEnabled, setTTradingPermanentlyEnabled] =
    useState(false);

  const [tWalletBalance, setTWalletBalance] = useState("0");
  const [tWalletFeeExempt, setTWalletFeeExempt] = useState(false);
  const [tWalletTradingExempt, setTWalletTradingExempt] = useState(false);

  // Token write forms
  const [feeBpsInput, setFeeBpsInput] = useState("");
  const [feeEnabledInput, setFeeEnabledInput] = useState(false);
  const [feeCollectorInput, setFeeCollectorInput] = useState("");

  const [tradingExemptAddr, setTradingExemptAddr] = useState("");
  const [tradingExemptValue, setTradingExemptValue] = useState(false);

  const [feeExemptAddr, setFeeExemptAddr] = useState("");
  const [feeExemptValue, setFeeExemptValue] = useState(false);

  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");

  // ======================
  // ICO read state
  // ======================
  const [icoOwner, setIcoOwner] = useState(null);
  const [icoUsdt, setIcoUsdt] = useState(null);
  const [icoCerToken, setIcoCerToken] = useState(null);
  const [icoSaleActive, setIcoSaleActive] = useState(false);
  const [icoPrice, setIcoPrice] = useState("0");
  const [icoTotalDepositedUSDT, setIcoTotalDepositedUSDT] = useState("0");
  const [icoTotalDistributedCER, setIcoTotalDistributedCER] = useState("0");
  const [icoUsdcBalance, setIcoUsdcBalance] = useState("0");
  const [icoAibtcBalance, setIcoAibtcBalance] = useState("0");

  // ICO write forms
  const [icoNewPrice, setIcoNewPrice] = useState("");
  const [icoWithdrawUSDC, setIcoWithdrawUSDC] = useState("");
  const [icoWithdrawCER, setIcoWithdrawCER] = useState("");

  // ======================
  // Staking read state
  // ======================
  const [stakingOwner, setStakingOwner] = useState(null);
  const [stakingPaused, setStakingPaused] = useState(false);
  const [stakingToken, setStakingToken] = useState(null);

  const [stakingTotalStaked, setStakingTotalStaked] = useState("0");
  const [stakingAnnualBudget, setStakingAnnualBudget] = useState("0");
  const [stakingRewardRatePerSec, setStakingRewardRatePerSec] = useState("0");
  const [stakingAPY, setStakingAPY] = useState("0");
  const [stakingContractBalance, setStakingContractBalance] = useState("0");

  // ✅ New staking period state
  const [stakingRewardsEnd, setStakingRewardsEnd] = useState("0"); // unix
  const [stakingRewardsActive, setStakingRewardsActive] = useState(false);

  const [stakingUserStaked, setStakingUserStaked] = useState("0");
  const [stakingUserUnclaimed, setStakingUserUnclaimed] = useState("0");
  const [stakingUserPending, setStakingUserPending] = useState("0");
  const [stakingUserLastClaim, setStakingUserLastClaim] = useState("0");

  // Staking write forms
  const [stakingNewBudgetTokens, setStakingNewBudgetTokens] = useState(""); // in whole tokens (human input)
  const [stakingRestartBudgetTokens, setStakingRestartBudgetTokens] =
    useState(""); // ✅ restartRewards()

  // ======================
  // Contracts
  // ======================
  const tokenRead = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
  }, [provider]);

  const tokenWrite = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  }, [signer]);

  const icoRead = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(ICO_ADDRESS, ICO_ABI, provider);
  }, [provider]);

  const icoWrite = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(ICO_ADDRESS, ICO_ABI, signer);
  }, [signer]);

  const stakingRead = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
  }, [provider]);

  const stakingWrite = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
  }, [signer]);

  // ======================
  // Helpers
  // ======================
  const isValidAddress = (a) => {
    try {
      return ethers.utils.isAddress(a);
    } catch {
      return false;
    }
  };

  const shortAddr = (addr) => {
    if (!addr) return "-";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const parseAmount = (value, dec) => {
    return ethers.utils.parseUnits(String(value || "0"), dec);
  };

  const runTx = async (label, fn, after) => {
    setTxLoading(true);
    setTxStatus(`${label}...`);
    try {
      const tx = await fn();
      setTxStatus("Waiting confirmation...");
      const receipt = await tx.wait();
      setTxStatus(
        receipt.status === 1 ? "✅ Transaction confirmed" : "❌ Tx failed",
      );
      if (after) await after();
    } catch (e) {
      console.error(e);
      const shortMessage =
        e?.error?.data?.message ||
        e?.reason ||
        e?.message?.split("\n")[0] ||
        "Transaction failed";
      setTxStatus(
        e?.code === 4001
          ? "Transaction rejected by user"
          : `❌ ${shortMessage}`,
      );
    } finally {
      setTxLoading(false);
    }
  };

  const formatUnix = (unix) => {
    try {
      const n = Number(unix || 0);
      if (!n) return "-";
      return new Date(n * 1000).toLocaleString();
    } catch {
      return "-";
    }
  };

  // ======================
  // Reads (Token + ICO + Staking)
  // ======================
  const fetchAll = async () => {
    if (!provider || !tokenRead || !icoRead || !stakingRead) return;
    if (!isCorrectNetwork) return;

    setLoading(true);
    setError("");

    try {
      // --- Token code check ---
      const tokenCode = await provider.getCode(TOKEN_ADDRESS);
      if (tokenCode === "0x")
        throw new Error("Token: no contract code at this address.");

      // --- ICO code check ---
      const icoCode = await provider.getCode(ICO_ADDRESS);
      if (icoCode === "0x")
        throw new Error("ICO: no contract code at this address.");

      // --- Staking code check ---
      const stakingCode = await provider.getCode(STAKING_ADDRESS);
      if (stakingCode === "0x")
        throw new Error("Staking: no contract code at this address.");

      // -------- TOKEN READS --------
      const _name = await tokenRead.name();
      const _symbol = await tokenRead.symbol();
      const _decimals = await tokenRead.decimals();
      const d = Number(_decimals);

      setTName(_name);
      setTSymbol(_symbol);
      setTDecimals(d);

      const _supply = await tokenRead.totalSupply();
      setTTotalSupply(ethers.utils.formatUnits(_supply, d));

      const _owner = await tokenRead.owner();
      setTOwner(_owner);

      setTFeeBps(Number(await tokenRead.feeBasisPoints()));
      setTMaxFeeBps(Number(await tokenRead.MAX_FEE_BPS()));
      setTFeeCollector(await tokenRead.feeCollector());
      setTFeeEnabled(await tokenRead.feeEnabled());

      setTTradingEnabled(await tokenRead.tradingEnabled());
      setTTradingPermanentlyEnabled(
        await tokenRead.tradingPermanentlyEnabled(),
      );

      if (isConnected && account) {
        const bal = await tokenRead.balanceOf(account);
        setTWalletBalance(ethers.utils.formatUnits(bal, d));
        setTWalletFeeExempt(await tokenRead.isFeeExempt(account));
        setTWalletTradingExempt(await tokenRead.isTradingExempt(account));
      } else {
        setTWalletBalance("0");
        setTWalletFeeExempt(false);
        setTWalletTradingExempt(false);
      }

      // -------- ICO READS --------
      const _icoOwner = await icoRead.owner();
      setIcoOwner(_icoOwner);

      setIcoSaleActive(await icoRead.saleActive());

      const _price = await icoRead.price_usdc();
      setIcoPrice(_price.toString());

      const _totUSDT = await icoRead.totalDepositedusdc();
      setIcoTotalDepositedUSDT(ethers.utils.formatUnits(_totUSDT, 6));

      const _totCER = await icoRead.totalDistributedCER();
      setIcoTotalDistributedCER(ethers.utils.formatUnits(_totCER, 18));

      const _icoUsdcAddr = await icoRead.usdc();
      const _icoAibtcAddr = await icoRead.aibtc();

      setIcoUsdt(_icoUsdcAddr);
      setIcoCerToken(_icoAibtcAddr);

      // -------- ICO BALANCES (USDC + AIBTC) --------
      const usdcContract = new ethers.Contract(
        _icoUsdcAddr,
        ERC20_ABI_MIN,
        provider,
      );
      const aibtcContract = new ethers.Contract(
        _icoAibtcAddr,
        ERC20_ABI_MIN,
        provider,
      );

      // USDC
      let usdcDec = 6;
      try {
        usdcDec = Number(await usdcContract.decimals());
      } catch {}
      const usdcBal = await usdcContract.balanceOf(ICO_ADDRESS);
      setIcoUsdcBalance(ethers.utils.formatUnits(usdcBal, usdcDec));

      // AIBTC
      let aibtcDec = 18;
      try {
        aibtcDec = Number(await aibtcContract.decimals());
      } catch {}
      const aibtcBal = await aibtcContract.balanceOf(ICO_ADDRESS);
      setIcoAibtcBalance(ethers.utils.formatUnits(aibtcBal, aibtcDec));

      // -------- STAKING READS --------
      const _stakingOwner = await stakingRead.owner();
      setStakingOwner(_stakingOwner);

      const _paused = await stakingRead.paused();
      setStakingPaused(Boolean(_paused));

      const _stkToken = await stakingRead.cerToken();
      setStakingToken(_stkToken);

      const _totalStaked = await stakingRead.totalStakedAmount();
      setStakingTotalStaked(ethers.utils.formatUnits(_totalStaked, 18));

      const _budget = await stakingRead.annualRewardBudget();
      setStakingAnnualBudget(ethers.utils.formatUnits(_budget, 18)); // show in tokens

      const _rate = await stakingRead.rewardRatePerSecondGlobal();
      setStakingRewardRatePerSec(_rate.toString()); // raw per-second

      const _apyRaw = await stakingRead.currentAPY();
      const _apyPct = (
        Number(ethers.utils.formatUnits(_apyRaw, 18)) * 100
      ).toFixed(4);
      setStakingAPY(_apyPct);

      const _bal = await stakingRead.contractBalance();
      setStakingContractBalance(ethers.utils.formatUnits(_bal, 18));

      // ✅ NEW: rewardsEnd + rewardsActive
      try {
        const _end = await stakingRead.rewardsEnd();
        setStakingRewardsEnd(_end.toString());
      } catch {
        setStakingRewardsEnd("0");
      }

      try {
        const _active = await stakingRead.rewardsActive();
        setStakingRewardsActive(Boolean(_active));
      } catch {
        setStakingRewardsActive(false);
      }

      if (isConnected && account) {
        const s = await stakingRead.stakes(account);
        setStakingUserStaked(ethers.utils.formatUnits(s.amount, 18));
        setStakingUserUnclaimed(ethers.utils.formatUnits(s.unclaimed, 18));
        setStakingUserLastClaim(String(s.lastClaim));

        const pending = await stakingRead.calculateReward(account);
        setStakingUserPending(ethers.utils.formatUnits(pending, 18));
      } else {
        setStakingUserStaked("0");
        setStakingUserUnclaimed("0");
        setStakingUserPending("0");
        setStakingUserLastClaim("0");
      }
    } catch (e) {
      console.error(e);
      setError(
        e?.reason ||
          e?.error?.message ||
          e?.message?.split("\n")[0] ||
          "Read failed",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!provider || !isCorrectNetwork) return;
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, isCorrectNetwork, isConnected, account]);

  // ======================
  // Ownership checks
  // ======================
  const isTokenOwner =
    isConnected && account && tOwner
      ? tOwner.toLowerCase() === account.toLowerCase()
      : false;

  const isIcoOwner =
    isConnected && account && icoOwner
      ? icoOwner.toLowerCase() === account.toLowerCase()
      : false;

  const isStakingOwner =
    isConnected && account && stakingOwner
      ? stakingOwner.toLowerCase() === account.toLowerCase()
      : false;

  // ======================
  // Token write handlers
  // ======================
  const onEnableTrading = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    return runTx(
      "Token: enabling trading",
      () => tokenWrite.enableTrading(),
      fetchAll,
    );
  };

  const onSetFee = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    if (feeBpsInput === "" || Number.isNaN(Number(feeBpsInput)))
      return setTxStatus("Enter valid bps");
    return runTx(
      "Token: setting fee",
      () => tokenWrite.setFee(Number(feeBpsInput)),
      fetchAll,
    );
  };

  const onSetFeeEnabled = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    return runTx(
      "Token: setting fee enabled",
      () => tokenWrite.setFeeEnabled(Boolean(feeEnabledInput)),
      fetchAll,
    );
  };

  const onSetFeeCollector = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    if (!isValidAddress(feeCollectorInput))
      return setTxStatus("Invalid address");
    return runTx(
      "Token: setting fee collector",
      () => tokenWrite.setFeeCollector(feeCollectorInput),
      fetchAll,
    );
  };

  const onSetTradingExempt = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    if (!isValidAddress(tradingExemptAddr))
      return setTxStatus("Invalid address");
    return runTx(
      "Token: setting trading exempt",
      () =>
        tokenWrite.setTradingExempt(
          tradingExemptAddr,
          Boolean(tradingExemptValue),
        ),
      fetchAll,
    );
  };

  const onSetFeeExempt = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    if (!isValidAddress(feeExemptAddr)) return setTxStatus("Invalid address");
    return runTx(
      "Token: setting fee exempt",
      () => tokenWrite.setFeeExempt(feeExemptAddr, Boolean(feeExemptValue)),
      fetchAll,
    );
  };

  const onMint = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isTokenOwner) return setTxStatus("Only token owner");
    if (!isValidAddress(mintTo)) return setTxStatus("Invalid mint address");
    if (!mintAmount || Number(mintAmount) <= 0)
      return setTxStatus("Enter mint amount");
    const amount = parseAmount(mintAmount, tDecimals);
    return runTx(
      "Token: minting",
      () => tokenWrite.mint(mintTo, amount),
      fetchAll,
    );
  };

  const onBurn = async () => {
    if (!tokenWrite) return setTxStatus("Signer not available");
    if (!isConnected) return setTxStatus("Connect wallet");
    if (!burnAmount || Number(burnAmount) <= 0)
      return setTxStatus("Enter burn amount");
    const amount = parseAmount(burnAmount, tDecimals);
    return runTx("Token: burning", () => tokenWrite.burn(amount), fetchAll);
  };

  // ======================
  // ICO write handlers
  // ======================
  const onIcoSetPrice = async () => {
    if (!icoWrite) return setTxStatus("Signer not available");
    if (!isIcoOwner) return setTxStatus("Only ICO owner");
    if (
      icoNewPrice === "" ||
      Number.isNaN(Number(icoNewPrice)) ||
      Number(icoNewPrice) <= 0
    ) {
      return setTxStatus("Enter valid newPrice");
    }
    return runTx(
      "ICO: setting price",
      () => icoWrite.setPrice(Number(icoNewPrice)),
      fetchAll,
    );
  };

  const onIcoStartSale = async () => {
    if (!icoWrite) return setTxStatus("Signer not available");
    if (!isIcoOwner) return setTxStatus("Only ICO owner");
    return runTx("ICO: starting sale", () => icoWrite.startSale(), fetchAll);
  };

  const onIcoStopSale = async () => {
    if (!icoWrite) return setTxStatus("Signer not available");
    if (!isIcoOwner) return setTxStatus("Only ICO owner");
    return runTx("ICO: stopping sale", () => icoWrite.stopSale(), fetchAll);
  };

  const onIcoWithdrawUSDC = async () => {
    if (!icoWrite) return setTxStatus("Signer not available");
    if (!isIcoOwner) return setTxStatus("Only ICO owner");
    if (!icoWithdrawUSDC || Number(icoWithdrawUSDC) <= 0)
      return setTxStatus("Enter withdraw amount");
    return runTx(
      "ICO: withdrawing USDC",
      () => icoWrite.withdrawUSDC(Number(icoWithdrawUSDC)),
      fetchAll,
    );
  };

  const onIcoWithdrawCER = async () => {
    if (!icoWrite) return setTxStatus("Signer not available");
    if (!isIcoOwner) return setTxStatus("Only ICO owner");
    if (!icoWithdrawCER || Number(icoWithdrawCER) <= 0)
      return setTxStatus("Enter withdraw amount");
    return runTx(
      "ICO: withdrawing CER",
      () => icoWrite.withdrawCER(Number(icoWithdrawCER)),
      fetchAll,
    );
  };

  // ======================
  // Staking write handlers
  // ======================
  const onStakingSetBudget = async () => {
    if (!stakingWrite) return setTxStatus("Signer not available");
    if (!isStakingOwner) return setTxStatus("Only Staking owner");
    if (
      stakingNewBudgetTokens === "" ||
      Number.isNaN(Number(stakingNewBudgetTokens)) ||
      Number(stakingNewBudgetTokens) <= 0
    ) {
      return setTxStatus("Enter valid annual budget (tokens)");
    }

    const budgetWei = ethers.utils.parseUnits(
      String(stakingNewBudgetTokens),
      18,
    );

    return runTx(
      "Staking: setting annual budget",
      () => stakingWrite.setAnnualRewardBudget(budgetWei),
      fetchAll,
    );
  };

  const onStakingRestartRewards = async () => {
    if (!stakingWrite) return setTxStatus("Signer not available");
    if (!isStakingOwner) return setTxStatus("Only Staking owner");
    if (
      stakingRestartBudgetTokens === "" ||
      Number.isNaN(Number(stakingRestartBudgetTokens)) ||
      Number(stakingRestartBudgetTokens) <= 0
    ) {
      return setTxStatus("Enter valid restart budget (tokens)");
    }

    const budgetWei = ethers.utils.parseUnits(
      String(stakingRestartBudgetTokens),
      18,
    );

    return runTx(
      "Staking: restarting rewards",
      () => stakingWrite.restartRewards(budgetWei),
      fetchAll,
    );
  };

  const onStakingPause = async () => {
    if (!stakingWrite) return setTxStatus("Signer not available");
    if (!isStakingOwner) return setTxStatus("Only Staking owner");
    return runTx("Staking: pause", () => stakingWrite.pause(), fetchAll);
  };

  const onStakingUnpause = async () => {
    if (!stakingWrite) return setTxStatus("Signer not available");
    if (!isStakingOwner) return setTxStatus("Only Staking owner");
    return runTx("Staking: unpause", () => stakingWrite.unpause(), fetchAll);
  };

  // ======================
  // Guards
  // ======================
  if (!provider) {
    return (
      <div className="admin-isolated">
        <div className="admin-shell">
          <div className="admin-alert">MetaMask not detected.</div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="admin-isolated">
        <div className="admin-shell">
          <div className="admin-alert">
            Wrong network. Current chainId: {chainId}
          </div>
          <button onClick={switchNetwork} className="admin-btn">
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-isolated">
      <div className="admin-shell">
        <div className="admin-topbar">
          <div className="admin-title">
            <div className="admin-kicker">Internal</div>
            <h1>Admin Dashboard</h1>
          </div>

          <div className="admin-actions">
            <button onClick={fetchAll} className="admin-btn" disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {(error || txStatus) && (
          <div className="admin-alert">
            {error ? <div>{error}</div> : null}
            {txStatus ? (
              <div style={{ marginTop: error ? 8 : 0 }}>{txStatus}</div>
            ) : null}
          </div>
        )}

        {/* ===================== TOKEN SECTION ===================== */}
        <div className="admin-section-block">
          <div className="admin-block-header">
            <div className="admin-block-title">Token</div>
            <div className="admin-block-subtitle">
              {TOKEN_ADDRESS ? shortAddr(TOKEN_ADDRESS) : "-"}
            </div>
          </div>

          <div className="admin-split-layout">
            {/* READS */}
            <div className="admin-pane admin-pane-reads">
              <div className="admin-pane-title">Reads</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Contract</div>
                  <div className="admin-mono">{TOKEN_ADDRESS}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Name</div>
                  <div className="admin-value">{tName}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Symbol</div>
                  <div className="admin-value">{tSymbol}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Decimals</div>
                  <div className="admin-value">{tDecimals}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Total Supply</div>
                  <div className="admin-value">
                    {Number(tTotalSupply).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner</div>
                  <div className="admin-mono">
                    {tOwner || "-"}
                    {isTokenOwner ? (
                      <span className="admin-pill" style={{ marginLeft: 10 }}>
                        YOU
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Fee Enabled</div>
                  <div className="admin-value">
                    {tFeeEnabled ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Fee</div>
                  <div className="admin-value">
                    {tFeeBps} bps ({(tFeeBps / 100).toFixed(2)}%)
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Max Fee</div>
                  <div className="admin-value">
                    {tMaxFeeBps} bps ({(tMaxFeeBps / 100).toFixed(2)}%)
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Fee Collector</div>
                  <div className="admin-mono">{tFeeCollector || "-"}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Trading Enabled</div>
                  <div className="admin-value">
                    {tTradingEnabled ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Trading Permanently</div>
                  <div className="admin-value">
                    {tTradingPermanentlyEnabled ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Wallet</div>
                  <div className="admin-mono">
                    {isConnected && account ? account : "Not connected"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Wallet Balance</div>
                  <div className="admin-value">
                    {Number(tWalletBalance).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Fee Exempt</div>
                  <div className="admin-value">
                    {tWalletFeeExempt ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Trading Exempt</div>
                  <div className="admin-value">
                    {tWalletTradingExempt ? "True" : "False"}
                  </div>
                </div>
              </div>
            </div>

            {/* WRITES */}
            <div className="admin-pane admin-pane-writes">
              <div className="admin-pane-title">Writes</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner actions</div>
                  <div className="admin-hint">
                    {isTokenOwner
                      ? "You are token owner."
                      : "Only token owner can execute these."}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Enable Trading</div>
                  <div className="admin-row">
                    <button
                      className="admin-btn"
                      onClick={onEnableTrading}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Enable Trading (permanent)
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Fee (bps)</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 100"
                      value={feeBpsInput}
                      onChange={(e) => setFeeBpsInput(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onSetFee}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Set Fee
                    </button>
                  </div>
                  <div className="admin-hint">Max: {tMaxFeeBps} bps</div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Fee Enabled</div>
                  <div className="admin-row">
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={feeEnabledInput}
                        onChange={(e) => setFeeEnabledInput(e.target.checked)}
                      />
                      <span>Enable fees</span>
                    </label>
                    <button
                      className="admin-btn"
                      onClick={onSetFeeEnabled}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Fee Collector</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="0x..."
                      value={feeCollectorInput}
                      onChange={(e) => setFeeCollectorInput(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onSetFeeCollector}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Set Collector
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Trading Exempt</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="0x..."
                      value={tradingExemptAddr}
                      onChange={(e) => setTradingExemptAddr(e.target.value)}
                    />
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={tradingExemptValue}
                        onChange={(e) =>
                          setTradingExemptValue(e.target.checked)
                        }
                      />
                      <span>Exempt</span>
                    </label>
                    <button
                      className="admin-btn"
                      onClick={onSetTradingExempt}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Fee Exempt</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="0x..."
                      value={feeExemptAddr}
                      onChange={(e) => setFeeExemptAddr(e.target.value)}
                    />
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={feeExemptValue}
                        onChange={(e) => setFeeExemptValue(e.target.checked)}
                      />
                      <span>Exempt</span>
                    </label>
                    <button
                      className="admin-btn"
                      onClick={onSetFeeExempt}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Mint (onlyOwner)</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="to 0x..."
                      value={mintTo}
                      onChange={(e) => setMintTo(e.target.value)}
                    />
                    <input
                      className="admin-input"
                      type="number"
                      placeholder={`amount (${tSymbol})`}
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                    />
                  </div>
                  <div className="admin-row">
                    <button
                      className="admin-btn"
                      onClick={onMint}
                      disabled={!isTokenOwner || txLoading}
                    >
                      Mint
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Burn</div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder={`amount (${tSymbol})`}
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onBurn}
                      disabled={!isConnected || txLoading}
                    >
                      Burn
                    </button>
                  </div>
                  <div className="admin-hint">Burn burns caller balance.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== ICO SECTION ===================== */}
        <div className="admin-section-block" style={{ marginTop: 18 }}>
          <div className="admin-block-header">
            <div className="admin-block-title">ICO</div>
            <div className="admin-block-subtitle">
              {ICO_ADDRESS ? shortAddr(ICO_ADDRESS) : "-"}
            </div>
          </div>

          <div className="admin-split-layout">
            {/* READS */}
            <div className="admin-pane admin-pane-reads">
              <div className="admin-pane-title">Reads</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Contract</div>
                  <div className="admin-mono">{ICO_ADDRESS}</div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner</div>
                  <div className="admin-mono">
                    {icoOwner || "-"}
                    {isIcoOwner ? (
                      <span className="admin-pill" style={{ marginLeft: 10 }}>
                        YOU
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">USDC</div>
                  <div className="admin-mono">{icoUsdt || "-"}</div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">AIBTC</div>
                  <div className="admin-mono">{icoCerToken || "-"}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Sale Active</div>
                  <div className="admin-value">
                    {icoSaleActive ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Price (cents)</div>
                  <div className="admin-value">{icoPrice}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Total Deposited USDT</div>
                  <div className="admin-value">
                    {Number(icoTotalDepositedUSDT).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Total Distributed</div>
                  <div className="admin-value">
                    {Number(icoTotalDistributedCER).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">ICO USDC Balance</div>
                  <div className="admin-value">
                    {Number(icoUsdcBalance).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">ICO AIBTC Balance</div>
                  <div className="admin-value">
                    {Number(icoAibtcBalance).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* WRITES */}
            <div className="admin-pane admin-pane-writes">
              <div className="admin-pane-title">Writes</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner actions</div>
                  <div className="admin-hint">
                    {isIcoOwner
                      ? "You are ICO owner."
                      : "Only ICO owner can execute these."}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Sale Controls</div>
                  <div className="admin-row">
                    <button
                      className="admin-btn"
                      onClick={onIcoStartSale}
                      disabled={!isIcoOwner || txLoading}
                    >
                      Start Sale
                    </button>
                    <button
                      className="admin-btn"
                      onClick={onIcoStopSale}
                      disabled={!isIcoOwner || txLoading}
                    >
                      Stop Sale
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">
                    Set Price (raw uint256)
                  </div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 10"
                      value={icoNewPrice}
                      onChange={(e) => setIcoNewPrice(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onIcoSetPrice}
                      disabled={!isIcoOwner || txLoading}
                    >
                      Set Price
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Withdraw USDC</div>
                  <div className="admin-hint">
                    Input is in whole units. Contract multiplies by 1e6
                    internally.
                  </div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 100"
                      value={icoWithdrawUSDC}
                      onChange={(e) => setIcoWithdrawUSDC(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onIcoWithdrawUSDC}
                      disabled={!isIcoOwner || txLoading}
                    >
                      Withdraw USDC
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Withdraw AIBTC</div>
                  <div className="admin-hint">
                    Input is in whole units. Contract multiplies by 1e18
                    internally.
                  </div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 1000"
                      value={icoWithdrawCER}
                      onChange={(e) => setIcoWithdrawCER(e.target.value)}
                    />
                    <button
                      className="admin-btn"
                      onClick={onIcoWithdrawCER}
                      disabled={!isIcoOwner || txLoading}
                    >
                      Withdraw CER
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== STAKING SECTION ===================== */}
        <div className="admin-section-block" style={{ marginTop: 18 }}>
          <div className="admin-block-header">
            <div className="admin-block-title">Staking (AIBTC)</div>
            <div className="admin-block-subtitle">
              {STAKING_ADDRESS ? shortAddr(STAKING_ADDRESS) : "-"}
            </div>
          </div>

          <div className="admin-split-layout">
            {/* READS */}
            <div className="admin-pane admin-pane-reads">
              <div className="admin-pane-title">Reads</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Contract</div>
                  <div className="admin-mono">{STAKING_ADDRESS}</div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner</div>
                  <div className="admin-mono">
                    {stakingOwner || "-"}
                    {isStakingOwner ? (
                      <span className="admin-pill" style={{ marginLeft: 10 }}>
                        YOU
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Staking Token</div>
                  <div className="admin-mono">{stakingToken || "-"}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Paused</div>
                  <div className="admin-value">
                    {stakingPaused ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Rewards Active</div>
                  <div className="admin-value">
                    {stakingRewardsActive ? "True" : "False"}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Rewards End (time)</div>
                  <div className="admin-value">
                    {formatUnix(stakingRewardsEnd)}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Contract Balance</div>
                  <div className="admin-value">
                    {Number(stakingContractBalance).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Total Staked</div>
                  <div className="admin-value">
                    {Number(stakingTotalStaked).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Annual Budget (tokens)</div>
                  <div className="admin-value">
                    {Number(stakingAnnualBudget).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">
                    Reward Rate / sec (raw)
                  </div>
                  <div className="admin-mono">{stakingRewardRatePerSec}</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Current APY</div>
                  <div className="admin-value">{stakingAPY}%</div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Your stake</div>
                  <div className="admin-value">
                    {Number(stakingUserStaked).toLocaleString()} AIBTC
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">Your pending</div>
                  <div className="admin-value">
                    {Number(stakingUserPending).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-label">
                    Your unclaimed snapshot
                  </div>
                  <div className="admin-value">
                    {Number(stakingUserUnclaimed).toLocaleString()}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Your lastClaim (unix)</div>
                  <div className="admin-mono">{stakingUserLastClaim}</div>
                </div>
              </div>
            </div>

            {/* WRITES */}
            <div className="admin-pane admin-pane-writes">
              <div className="admin-pane-title">Writes</div>

              <div className="admin-grid">
                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Owner actions</div>
                  <div className="admin-hint">
                    {isStakingOwner
                      ? "You are Staking owner."
                      : "Only Staking owner can execute these."}
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Set Annual Budget</div>
                  <div className="admin-hint">
                    Input is in <b>whole tokens</b>. It will be converted to 18
                    decimals automatically.
                  </div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 250000"
                      value={stakingNewBudgetTokens}
                      onChange={(e) =>
                        setStakingNewBudgetTokens(e.target.value)
                      }
                    />
                    <button
                      className="admin-btn"
                      onClick={onStakingSetBudget}
                      disabled={!isStakingOwner || txLoading}
                    >
                      Set Budget
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">
                    Restart Rewards (new year)
                  </div>
                  <div className="admin-hint">
                    Use this <b>after rewards ended</b>. Remember: fund the
                    contract with AIBTC first.
                  </div>
                  <div className="admin-row">
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="e.g. 1000000"
                      value={stakingRestartBudgetTokens}
                      onChange={(e) =>
                        setStakingRestartBudgetTokens(e.target.value)
                      }
                    />
                    <button
                      className="admin-btn"
                      onClick={onStakingRestartRewards}
                      disabled={
                        !isStakingOwner || txLoading || stakingRewardsActive
                      }
                      title={
                        stakingRewardsActive
                          ? "Rewards still active (wait until rewardsEnd)"
                          : ""
                      }
                    >
                      Restart
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Pause Controls</div>
                  <div className="admin-row">
                    <button
                      className="admin-btn"
                      onClick={onStakingPause}
                      disabled={!isStakingOwner || txLoading || stakingPaused}
                    >
                      Pause
                    </button>
                    <button
                      className="admin-btn"
                      onClick={onStakingUnpause}
                      disabled={!isStakingOwner || txLoading || !stakingPaused}
                    >
                      Unpause
                    </button>
                  </div>
                </div>

                <div className="admin-card admin-card-wide">
                  <div className="admin-card-label">Tip</div>
                  <div className="admin-hint">
                    If rewards don’t increase, check{" "}
                    <span className="admin-mono">Reward Rate / sec</span> is not
                    zero. Example: 250k/year must be{" "}
                    <span className="admin-mono">250000 * 1e18</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-footer">
          MetaMask reads/writes • Auto-refresh 10s
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
