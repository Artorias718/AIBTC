import React, { useEffect, useMemo, useState, useContext } from "react";
import { ethers } from "ethers";
import { WalletContext } from "./WalletContext";
import { CONFIG } from "../config";
import "./StakingPage.css"; // oppure un tuo css dedicato

const AIBTC_TOKEN = {
  name: "AIBTC",
  symbol: "AIBTC",
  address: CONFIG.AIBTC_ADDRESS,
  decimals: 18,
  image: "/aibtc.png",
  stakingContract: CONFIG.AIBTC_STAKING,
};

// RPC pubblico di fallback (stesso che usi nello staking dashboard)
const FALLBACK_RPC = CONFIG.READ_RPC;

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

const shortError = (e) =>
  e?.error?.data?.message ||
  e?.reason ||
  e?.message?.split("\n")[0] ||
  "Transaction failed";

export default function AIBTCStakingCard() {
  const { isConnected, account, signer, provider } = useContext(WalletContext);

  const [walletBal, setWalletBal] = useState("0");
  const [stakedBal, setStakedBal] = useState("0");
  const [pending, setPending] = useState("0");
  const [apy, setApy] = useState("-");

  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState("0");
  const [modalMax, setModalMax] = useState("0");

  const [txLoading, setTxLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [isApproved, setIsApproved] = useState(false);

  /**
   * ✅ Provider di lettura sempre disponibile:
   * - se WalletContext fornisce provider => usalo
   * - altrimenti usa JsonRpcProvider di fallback
   */
  const readProvider = useMemo(() => {
    if (provider) return provider;
    return new ethers.providers.JsonRpcProvider(FALLBACK_RPC);
  }, [provider]);

  // ---------- contracts (READ) ----------
  const tokenRead = useMemo(() => {
    if (!readProvider) return null;
    return new ethers.Contract(
      AIBTC_TOKEN.address,
      CONFIG.ERC20_ABI,
      readProvider,
    );
  }, [readProvider]);

  const stakingRead = useMemo(() => {
    if (!readProvider) return null;
    return new ethers.Contract(
      AIBTC_TOKEN.stakingContract,
      CONFIG.ABI_AIBTC_STAKING_CONCRAT,
      readProvider,
    );
  }, [readProvider]);

  // ---------- contracts (WRITE) ----------
  const tokenWrite = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(AIBTC_TOKEN.address, CONFIG.ERC20_ABI, signer);
  }, [signer]);

  const stakingWrite = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(
      AIBTC_TOKEN.stakingContract,
      CONFIG.ABI_AIBTC_STAKING_CONCRAT,
      signer,
    );
  }, [signer]);

  // ---------- reads ----------
  const fetchApy = async () => {
    if (!stakingRead) return;
    try {
      const apyRaw = await stakingRead
        .currentAPY()
        .catch(() => ethers.constants.Zero);

      // currentAPY ritorna 1e18 -> % = formatUnits * 100
      const apyPct = (
        Number(ethers.utils.formatUnits(apyRaw, 18)) * 100
      ).toFixed(2);
      setApy(`${apyPct}%`);
    } catch (e) {
      console.error("AIBTC APY fetch error:", e);
      setApy("-");
    }
  };

  const fetchUserData = async () => {
    if (!tokenRead || !stakingRead) return;

    if (!account) {
      setWalletBal("0");
      setStakedBal("0");
      setPending("0");
      return;
    }

    try {
      const [wb, stakeData, reward] = await Promise.all([
        tokenRead.balanceOf(account),
        stakingRead.stakes(account),
        stakingRead.calculateReward(account),
      ]);

      setWalletBal(ethers.utils.formatUnits(wb, AIBTC_TOKEN.decimals));
      setStakedBal(
        ethers.utils.formatUnits(stakeData.amount, AIBTC_TOKEN.decimals),
      );
      setPending(ethers.utils.formatUnits(reward, AIBTC_TOKEN.decimals));
    } catch (e) {
      console.error("AIBTC staking user fetch error:", e);
    }
  };

  const fetchAll = async () => {
    await fetchApy(); // ✅ sempre (anche senza wallet)
    await fetchUserData(); // ✅ solo se account (altrimenti resetta)
  };

  const checkAllowance = async (amountStr) => {
    if (!tokenRead || !account) return setIsApproved(false);
    try {
      const allowance = await tokenRead.allowance(
        account,
        AIBTC_TOKEN.stakingContract,
      );
      const amountWei = ethers.utils.parseUnits(
        amountStr || "0",
        AIBTC_TOKEN.decimals,
      );
      setIsApproved(allowance.gte(amountWei));
    } catch (e) {
      console.error("Allowance check failed:", e);
      setIsApproved(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 10000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, readProvider]);

  // ---------- actions ----------
  const doApproveIfNeeded = async (amountStr) => {
    if (!tokenWrite) throw new Error("Signer not available");
    if (!account) throw new Error("Wallet not connected");

    const amountWei = ethers.utils.parseUnits(amountStr, AIBTC_TOKEN.decimals);

    const current = await tokenWrite.allowance(
      account,
      AIBTC_TOKEN.stakingContract,
    );
    if (current.gte(amountWei)) return;

    setStatus("Approving AIBTC...");
    const tx = await tokenWrite.approve(AIBTC_TOKEN.stakingContract, amountWei);
    await tx.wait();
  };

  const handleStake = async () => {
    if (!isConnected || !account) return setStatus("Connect wallet");
    if (!stakingWrite) return setStatus("Signer not available");
    if (!modalAmount || Number(modalAmount) <= 0)
      return setStatus("Enter a valid amount");

    setTxLoading(true);
    setStatus("Preparing...");
    try {
      await doApproveIfNeeded(modalAmount);

      const amountWei = ethers.utils.parseUnits(
        modalAmount,
        AIBTC_TOKEN.decimals,
      );

      setStatus("Staking...");
      const tx = await stakingWrite.stake(amountWei);
      await tx.wait();

      setStatus("Stake confirmed ✅");
      setStakeModalOpen(false);
      await fetchAll();
    } catch (e) {
      console.error(e);
      setStatus(`Stake failed: ${shortError(e)}`);
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawPartial = async () => {
    if (!isConnected || !account) return setStatus("Connect wallet");
    if (!stakingWrite) return setStatus("Signer not available");
    if (!modalAmount || Number(modalAmount) <= 0)
      return setStatus("Enter a valid amount");

    setTxLoading(true);
    setStatus("Withdrawing...");
    try {
      const amountWei = ethers.utils.parseUnits(
        modalAmount,
        AIBTC_TOKEN.decimals,
      );

      const tx = await stakingWrite.withdrawPartial(amountWei);
      await tx.wait();

      setStatus("Withdraw confirmed ✅");
      setWithdrawModalOpen(false);
      await fetchAll();
    } catch (e) {
      console.error(e);
      setStatus(`Withdraw failed: ${shortError(e)}`);
    } finally {
      setTxLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !account) return setStatus("Connect wallet");
    if (!stakingWrite) return setStatus("Signer not available");

    setTxLoading(true);
    setStatus("Claiming...");
    try {
      const tx = await stakingWrite.claim();
      await tx.wait();
      setStatus("Claim confirmed ✅");
      await fetchAll();
    } catch (e) {
      console.error(e);
      setStatus(`Claim failed: ${shortError(e)}`);
    } finally {
      setTxLoading(false);
    }
  };

  // ---------- modal open helpers ----------
  const openStakeModal = async () => {
    setModalMax(walletBal || "0");
    setModalAmount("0");
    setStakeModalOpen(true);
    await checkAllowance("0");
  };

  const openWithdrawModal = () => {
    setModalMax(stakedBal || "0");
    setModalAmount(stakedBal || "0");
    setWithdrawModalOpen(true);
  };

  return (
    <div className="staking-card-status" style={{ marginBottom: 18 }}>
      <div className="staking-row header">
        <div className="cell">Vault</div>
        <div className="cell">APY</div>
        <div className="cell">Staked</div>
        <div className="cell">Pending</div>
        <div className="cell actions-cell"></div>
      </div>

      <div className="staking-row">
        <div className="cell vault-cell">
          <img
            src={AIBTC_TOKEN.image}
            alt={AIBTC_TOKEN.symbol}
            className="vault-token-img"
          />
          <span>{AIBTC_TOKEN.symbol}</span>
        </div>

        <div className="cell apy-cell">{apy}</div>

        <div className="cell">{formatAmount(stakedBal)}</div>
        <div className="cell">{formatAmount(pending)}</div>

        <div className="cell actions-cell">
          <button
            className="btn btn-secondary"
            onClick={handleClaim}
            disabled={txLoading || Number(pending || "0") === 0 || !account}
            title={!account ? "Connect wallet to claim" : undefined}
          >
            Claim
          </button>

          <button
            className="btn btn-primary"
            onClick={openStakeModal}
            disabled={!account || Number(walletBal || "0") === 0 || txLoading}
          >
            Stake
          </button>

          <button
            className="btn btn-secondary"
            onClick={openWithdrawModal}
            disabled={!account || Number(stakedBal || "0") === 0 || txLoading}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Stake modal */}
      {stakeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Stake {AIBTC_TOKEN.symbol}</h3>
            <p className="max-available-text">Max available: {modalMax}</p>

            <input
              type="range"
              min="0"
              max={modalMax}
              step="0.01"
              value={modalAmount}
              onChange={(e) => {
                const v = e.target.value;
                setModalAmount(v);
                checkAllowance(v);
              }}
            />
            <input
              type="number"
              min="0"
              max={modalMax}
              step="0.01"
              value={modalAmount}
              onChange={(e) => {
                const v = e.target.value;
                setModalAmount(v);
                checkAllowance(v);
              }}
            />

            {!isApproved && modalAmount !== "0" ? (
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                Allowance not sufficient: approve will be requested
                automatically.
              </div>
            ) : null}

            <div className="modal-buttons">
              <button
                className="btn btn-primary"
                onClick={handleStake}
                disabled={txLoading}
              >
                Confirm
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setStakeModalOpen(false)}
                disabled={txLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {withdrawModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Withdraw {AIBTC_TOKEN.symbol}</h3>
            <p className="max-available-text">Max available: {modalMax}</p>

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
                onClick={handleWithdrawPartial}
                disabled={txLoading}
              >
                Confirm Withdraw
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={txLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {status ? (
        <div
          className={`transaction-status ${
            status.toLowerCase().includes("failed") ? "error" : "success"
          }`}
        >
          {status}
        </div>
      ) : null}
    </div>
  );
}
