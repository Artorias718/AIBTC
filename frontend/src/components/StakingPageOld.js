// import "./StakingPage.css";
// import { ethers } from "ethers";
// import StakingStatus from "./StakingStatus";
// import React, { useState, useEffect, useContext } from "react";
// import { WalletContext } from "./WalletContext";
// import { CONFIG } from "../config";

// const TOKENS = [
//   {
//     name: "AIBTC",
//     symbol: "AIBTC",
//     address: CONFIG.AIBTC_ADDRESS,
//     decimals: 18,
//     image: "/aibtc.png",
//     stakingContract: CONFIG.AIBTC_STAKING,
//     useAaveWrapper: false,
//   },
//   {
//     name: "USDC",
//     symbol: "USDC",
//     address: CONFIG.USDT_ADDRESS,
//     decimals: 6,
//     image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
//     stakingContract: CONFIG.AAVE_USDC_WRAPPER,
//     useAaveWrapper: true,
//   },
//   {
//     name: "BTC",
//     symbol: "BTC",
//     address: "0x0000000000000000000000000000000000000002",
//     decimals: 18,
//     image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
//     stakingContract: CONFIG.AIBTC_STAKING,
//     useAaveWrapper: false,
//   },
// ];

// const StakingPage = () => {
//   const {
//     isConnected,
//     account,
//     connectWallet,
//     disconnectWallet,
//     provider,
//     signer,
//   } = useContext(WalletContext);

//   const [stakeAmount, setStakeAmount] = useState("");
//   const [transactionStatus, setTransactionStatus] = useState("");
//   const [isTransactionLoading, setIsTransactionLoading] = useState(false);
//   const [isApproved, setIsApproved] = useState(false);
//   const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
//   const [showTokens, setShowTokens] = useState(false);

//   useEffect(() => {
//     if (account && stakeAmount) {
//       checkAllowance(account);
//     }
//   }, [stakeAmount, account, selectedToken]);

//   const checkAllowance = async (address) => {
//     try {
//       const tokenContract = new ethers.Contract(
//         selectedToken.address,
//         CONFIG.ERC20_ABI,
//         provider
//       );
//       const allowance = await tokenContract.allowance(
//         address,
//         selectedToken.stakingContract
//       );

//       if (stakeAmount) {
//         const amountInWei = ethers.utils.parseUnits(
//           stakeAmount,
//           selectedToken.decimals
//         );
//         setIsApproved(allowance.gte(amountInWei));
//       } else {
//         setIsApproved(allowance.gt(0));
//       }
//     } catch (error) {
//       console.error("Error checking allowance:", error);
//     }
//   };

//   const handleApprove = async () => {
//     if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
//       setTransactionStatus("Enter a valid amount");
//       return;
//     }

//     try {
//       setTransactionStatus("Approving...");
//       setIsTransactionLoading(true);

//       const tokenContract = new ethers.Contract(
//         selectedToken.address,
//         CONFIG.ERC20_ABI,
//         signer
//       );
//       const amountInWei = ethers.utils.parseUnits(
//         stakeAmount,
//         selectedToken.decimals
//       );

//       const tx = await tokenContract.approve(
//         selectedToken.stakingContract,
//         amountInWei
//       );
//       await tx.wait();

//       setTransactionStatus("Approval confirmed ✅");
//       setIsApproved(true);

//       setTransactionStatus("Approval confirmed, starting stake...");
//       await handleStake();
//     } catch (error) {
//       console.error(error);
//       if (error.code === 4001) {
//         setTransactionStatus("Approval rejected by user");
//       } else {
//         setTransactionStatus("Approval failed");
//       }
//     } finally {
//       setIsTransactionLoading(false);
//     }
//   };

//   const handleStake = async () => {
//     if (!isConnected) {
//       setTransactionStatus("Please connect your wallet first");
//       return;
//     }

//     if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
//       setTransactionStatus("Please enter a valid amount");
//       return;
//     }

//     setTransactionStatus("Preparing transaction...");
//     setIsTransactionLoading(true);

//     try {
//       const amountInWei = ethers.utils.parseUnits(
//         stakeAmount,
//         selectedToken.decimals
//       );

//       if (selectedToken.useAaveWrapper) {
//         const aaveContract = new ethers.Contract(
//           selectedToken.stakingContract,
//           CONFIG.ABI_WRAPPER,
//           signer
//         );
//         const tx = await aaveContract.deposit(amountInWei);
//         setTransactionStatus("Transaction sent!");
//         await tx.wait();
//         setTransactionStatus("Transaction confirmed!");
//       } else {
//         const stakingContract = new ethers.Contract(
//           selectedToken.stakingContract,
//           CONFIG.ABI_AIBTC_STAKING_CONCRAT,
//           signer
//         );
//         const tx = await stakingContract.stake(amountInWei);
//         setTransactionStatus("Transaction sent!");
//         await tx.wait();
//         setTransactionStatus("Transaction confirmed!");
//       }
//     } catch (error) {
//       console.error("Transaction error:", error);
//       const shortMessage =
//         error?.error?.data?.message ||
//         error?.reason ||
//         error?.message?.split("\n")[0] ||
//         "Transaction failed";

//       setTransactionStatus(
//         error?.code === 4001
//           ? "Transaction rejected by user"
//           : `Transaction failed: ${shortMessage}`
//       );
//     } finally {
//       setIsTransactionLoading(false);
//     }
//   };

//   const formatAddress = (address) => {
//     if (!address) return "";
//     return `${address.slice(0, 6)}...${address.slice(-4)}`;
//   };

//   return (
//     <div className="staking-page">
//       <div className="container">
//         <div className="staking-header">
//           <h1>Stake Your Tokens</h1>
//           <p>Earn rewards by staking your tokens safely and securely.</p>
//         </div>

//         <div className="staking-card">
//           {isConnected ? (
//             <div className="wallet-connected">
//               <div className="wallet-info">
//                 <span className="wallet-icon">🔗</span>
//                 <span className="wallet-address">{formatAddress(account)}</span>
//               </div>
//               <button onClick={disconnectWallet} className="btn btn-secondary">
//                 Disconnect
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={connectWallet}
//               className="btn btn-primary btn-large"
//             >
//               Connect Wallet
//             </button>
//           )}

//           <div className="amount-input-section">
//             <label htmlFor="stakeAmount">Enter Amount to Stake:</label>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "12px",
//                 position: "relative",
//               }}
//             >
//               <div
//                 className="token-selector"
//                 onClick={() => setShowTokens(!showTokens)}
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "8px",
//                   cursor: "pointer",
//                   padding: "8px 12px",
//                   border: "1px solid #444",
//                   borderRadius: "10px",
//                   background: "#1a1a1a",
//                 }}
//               >
//                 <img
//                   src={selectedToken.image}
//                   alt={selectedToken.symbol}
//                   width={26}
//                   height={26}
//                 />
//                 <span>{selectedToken.symbol}</span>
//               </div>

//               {showTokens && (
//                 <div
//                   className="token-dropdown"
//                   style={{
//                     position: "absolute",
//                     top: "48px",
//                     left: "0",
//                     background: "#222",
//                     padding: "10px",
//                     borderRadius: "10px",
//                     border: "1px solid #333",
//                     zIndex: 100,
//                     width: "180px",
//                   }}
//                 >
//                   {TOKENS.map((t) => (
//                     <div
//                       key={t.address}
//                       className="token-dropdown-item"
//                       onClick={() => {
//                         setSelectedToken(t);
//                         setShowTokens(false);
//                         setIsApproved(false);
//                         setStakeAmount("");
//                       }}
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "10px",
//                         padding: "8px",
//                         cursor: "pointer",
//                         borderRadius: "6px",
//                       }}
//                     >
//                       <img
//                         src={t.image}
//                         alt={t.symbol}
//                         width={22}
//                         height={22}
//                       />
//                       <span>{t.name}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <input
//                 type="number"
//                 id="stakeAmount"
//                 value={stakeAmount}
//                 onChange={(e) => setStakeAmount(e.target.value)}
//                 placeholder="0.0"
//                 min="0"
//                 step="0.01"
//                 className="amount-input"
//               />
//             </div>
//           </div>

//           <button
//             onClick={
//               selectedToken.symbol === "USDC"
//                 ? handleApprove
//                 : isApproved
//                 ? handleStake
//                 : handleApprove
//             }
//             className={`btn btn-primary btn-large ${
//               isTransactionLoading ? "loading" : ""
//             }`}
//             disabled={isTransactionLoading}
//           >
//             {isTransactionLoading
//               ? "Processing..."
//               : selectedToken.symbol === "USDC"
//               ? "Approve & Stake"
//               : isApproved
//               ? "Stake Tokens"
//               : "Approve Token"}
//           </button>

//           {transactionStatus && (
//             <div
//               className={`transaction-status ${
//                 transactionStatus.includes("confirmed") ? "success" : "error"
//               }`}
//             >
//               {transactionStatus}
//             </div>
//           )}
//         </div>

//         <StakingStatus
//           account={account}
//           isConnected={isConnected}
//           stakingAddress={selectedToken.stakingContract}
//         />
//       </div>
//     </div>
//   );
// };

// export default StakingPage;
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
    address: CONFIG.USDT_ADDRESS,
    decimals: 6,
    image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    stakingContract: CONFIG.AAVE_USDC_WRAPPER,
    useAaveWrapper: true,
    hasClaim: false,
  },
  {
    name: "BTC",
    symbol: "BTC",
    address: "0x0000000000000000000000000000000000000002",
    decimals: 18,
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    stakingContract: CONFIG.AIBTC_STAKING,
    useAaveWrapper: false,
    hasClaim: false,
  },
];

const StakingDashboard = () => {
  const {
    isConnected,
    account,
    connectWallet,
    disconnectWallet,
    provider,
    signer,
  } = useContext(WalletContext);

  // Token selezionato per modali
  const [selectedToken, setSelectedToken] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  // Modali
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState("0");
  const [modalMax, setModalMax] = useState("0");

  // Stato transazioni
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  // Dati staking
  const [stakedAmount, setStakedAmount] = useState({});
  const [pendingReward, setPendingReward] = useState({});
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [usdcAPY, setUsdcAPY] = useState("0");
  const [globalAPY, setGlobalAPY] = useState("0");

  // -------------------------------
  // UTILITIES
  // -------------------------------
  const getProvider = () =>
    window.ethereum
      ? new ethers.providers.Web3Provider(window.ethereum)
      : new ethers.providers.JsonRpcProvider(
          "https://arb-sepolia.g.alchemy.com/v2/vc2BHZMxex5LPRm4virlhfB_eWJCG76j"
        );

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
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

  // -------------------------------
  // EFFECTS
  // -------------------------------
  useEffect(() => {
    fetchGlobalData();
    if (isConnected && account) {
      TOKENS.forEach((token) => fetchTokenData(token));
    }
  }, [isConnected, account]);

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
        provider
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
      if (token.symbol === "USDC") {
        const aToken = new ethers.Contract(
          CONFIG.AUSDC_ADDRESS,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );
        const balance = await aToken.balanceOf(account);
        setUsdcBalance(ethers.utils.formatUnits(balance, 6));

        const poolContract = new ethers.Contract(
          CONFIG.AAVE_USDC_POOL,
          CONFIG.ABI_AAVE_USDC_POOL,
          provider
        );
        const reserveData = await poolContract.getReserveData(
          CONFIG.USDT_ADDRESS
        );
        setUsdcAPY(
          ((Number(reserveData.currentLiquidityRate) / 1e27) * 100).toFixed(2)
        );
      } else {
        const stakingContract = new ethers.Contract(
          token.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          provider
        );
        const [stakeData, reward] = await Promise.all([
          stakingContract.stakes(account),
          stakingContract.calculateReward(account),
        ]);
        setStakedAmount((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(
            stakeData.amount,
            token.decimals
          ),
        }));
        setPendingReward((prev) => ({
          ...prev,
          [token.symbol]: ethers.utils.formatUnits(reward, token.decimals),
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${token.symbol}`, error);
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
        provider
      );
      const allowance = await tokenContract.allowance(
        account,
        selectedToken.stakingContract
      );
      const amountInWei = stakeAmount
        ? ethers.utils.parseUnits(stakeAmount, selectedToken.decimals)
        : ethers.constants.Zero;
      setIsApproved(allowance.gte(amountInWei));
    } catch (error) {
      console.error("Allowance check failed", error);
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
        selectedToken.address,
        CONFIG.ERC20_ABI,
        signer
      );
      const amountInWei = ethers.utils.parseUnits(
        stakeAmount,
        selectedToken.decimals
      );
      const tx = await tokenContract.approve(
        selectedToken.stakingContract,
        amountInWei
      );
      await tx.wait();
      setTransactionStatus("Approval confirmed ✅");
      setIsApproved(true);
      await handleStake();
    } catch (error) {
      console.error(error);
      setTransactionStatus(
        error.code === 4001 ? "Approval rejected by user" : "Approval failed"
      );
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleStake = async () => {
    try {
      setTransactionStatus("Processing stake...");
      setIsTransactionLoading(true);
      const amountInWei = ethers.utils.parseUnits(
        stakeAmount,
        selectedToken.decimals
      );

      if (selectedToken.useAaveWrapper) {
        const aaveContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_WRAPPER,
          signer
        );
        const tx = await aaveContract.deposit(amountInWei);
        await tx.wait();
      } else {
        const stakingContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          signer
        );
        const tx = await stakingContract.stake(amountInWei);
        await tx.wait();
      }
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
          : `Transaction failed: ${shortMessage}`
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
        signer
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

  // -------------------------------
  // WITHDRAW
  // -------------------------------
  const openWithdrawModal = (token) => {
    setSelectedToken(token);
    setModalMax(
      token.symbol === "USDC" ? usdcBalance : stakedAmount[token.symbol] || "0"
    );
    setModalAmount(
      token.symbol === "USDC" ? usdcBalance : stakedAmount[token.symbol] || "0"
    );
    setIsWithdrawModalOpen(true);
  };

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
        selectedToken.decimals
      );

      if (selectedToken.symbol === "USDC") {
        const wrapper = new ethers.Contract(
          CONFIG.AAVE_USDC_WRAPPER,
          CONFIG.ABI_WRAPPER,
          signer
        );
        const aToken = new ethers.Contract(
          CONFIG.AUSDC_ADDRESS,
          CONFIG.ERC20_ABI,
          signer
        );
        await (
          await aToken.approve(CONFIG.AAVE_USDC_WRAPPER, amountInWei)
        ).wait();
        await (await wrapper.withdraw(amountInWei)).wait();
      } else {
        const stakingContract = new ethers.Contract(
          selectedToken.stakingContract,
          CONFIG.ABI_AIBTC_STAKING_CONCRAT,
          signer
        );
        await (await stakingContract.withdrawPartial(amountInWei)).wait();
      }

      setTransactionStatus("Withdraw confirmed ✅");
      setIsWithdrawModalOpen(false);
      fetchTokenData(selectedToken);
    } catch (error) {
      console.error(error);
      setTransactionStatus("Withdraw failed ❌");
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // -------------------------------
  // STAKE MODAL
  // -------------------------------
  const openSupplyModal = (token) => {
    setSelectedToken(token);
    setModalMax(token.symbol === "USDC" ? usdcBalance : "0"); // Se vuoi puoi settare max basato su wallet
    setModalAmount("0");
    setIsSupplyModalOpen(true);
  };

  const confirmSupply = async () => {
    setStakeAmount(modalAmount);
    setIsSupplyModalOpen(false);
    if (selectedToken.symbol === "USDC") {
      await handleApprove();
    } else {
      await handleStake();
    }
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="staking-page">
      <div className="container">
        {/* Header originale */}
        <div className="staking-header">
          <h1>Stake Your Tokens</h1>
          <p>Earn rewards by staking your tokens safely and securely.</p>
        </div>

        {/* Tabella staking */}
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
                  {token.symbol === "USDC" ? `${usdcAPY}%` : `${globalAPY}%`}
                </div>

                <div className="cell deposit-cell">
                  {token.symbol === "USDC"
                    ? formatAmount(usdcBalance)
                    : formatAmount(stakedAmount[token.symbol])}
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
                        parseFloat(pendingReward[token.symbol]) === 0
                      }
                    >
                      Claim
                    </button>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() => openSupplyModal(token)}
                    disabled={!account}
                  >
                    Stake
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => openWithdrawModal(token)}
                    disabled={
                      !account ||
                      (token.symbol === "USDC"
                        ? parseFloat(usdcBalance) === 0
                        : parseFloat(stakedAmount[token.symbol]) === 0)
                    }
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}

            {/* Supply Modal */}
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

            {/* Withdraw Modal */}
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
                      onClick={handleWithdraw}
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
