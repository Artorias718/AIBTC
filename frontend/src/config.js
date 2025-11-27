// src/config.js
export const CONFIG = {
  TOKEN_ADDRESS: "0xcd52EEE45138681d669aEeFA661a1d3Ac8C87187",
  ICO_ADDRESS: "0x9B7B9B4e372D2d15609C8012aC5FEF946408dBd1",
  USDT_ADDRESS: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  STAKING_ADDRESS: "0xFd7410A6D5509C3dc52d10F686BDF2Cc81B54f30",
  AAVE_STAKING: "0x3Eb59eE2f1a516E61489E63E3Cb4F826AFbCBCAC",
  AAVE_USDC_ATOKEN: "0x460b97BD498E1157530AEb3086301d5225b91216",

  AAVE_POOL: "0xbfc91d59fdaa134a4ed45f7b584caf96d7792eff",

  ABI_STAKING: [
    "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim)",
    "function calculateReward(address) view returns (uint256)",
    "function currentAPY() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function claim() external",
    "function withdrawPartial(uint256 amount) external",
  ],
  ABI_WRAPPER_USDC: ["function withdraw(uint256 amount) external"],
  ABI_AAVE_POOL: [
    // ritorna tutti i dati della riserva di un asset
    "function getReserveData(address asset) view returns (tuple(" +
      "tuple(uint256 data) configuration," + // configuration map
      "uint128 liquidityIndex," +
      "uint128 currentLiquidityRate," + // APY supply in RAY (1e27)
      "uint128 variableBorrowIndex," +
      "uint128 currentVariableBorrowRate," +
      "uint128 currentStableBorrowRate," +
      "uint40 lastUpdateTimestamp," +
      "uint16 id," +
      "address aTokenAddress," +
      "address stableDebtTokenAddress," +
      "address variableDebtTokenAddress," +
      "address interestRateStrategyAddress," +
      "uint128 accruedToTreasury," +
      "uint128 unbacked," +
      "uint128 isolationModeTotalDebt" +
      "))",

    // ritorna income normalizzata della riserva (opzionale)
    "function getReserveNormalizedIncome(address asset) view returns (uint256)",

    // ritorna lista di tutti gli asset
    "function getReservesList() view returns (address[])",

    // ritorna numero di riserve attive
    "function getReservesCount() view returns (uint256)",
  ],
};
