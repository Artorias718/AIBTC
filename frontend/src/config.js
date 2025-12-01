// src/config.js
export const CONFIG = {
  //addresses

  // AIBTC_ADDRESS: "0xcd52EEE45138681d669aEeFA661a1d3Ac8C87187",
  // USDT_ADDRESS: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",

  // ICO: "0x9B7B9B4e372D2d15609C8012aC5FEF946408dBd1",

  AIBTC_STAKING: "0xFd7410A6D5509C3dc52d10F686BDF2Cc81B54f30",
  AAVE_USDC_WRAPPER: "0x3Eb59eE2f1a516E61489E63E3Cb4F826AFbCBCAC",

  AAVE_USDC_POOL: "0xbfc91d59fdaa134a4ed45f7b584caf96d7792eff",
  AUSDC_ADDRESS: "0x460b97BD498E1157530AEb3086301d5225b91216",

  //Mainnet
  AIBTC_ADDRESS: "0xB84d2F10Be486E8b0170A77b53ff674aaCCC278C",
  USDT_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  ICO: "0xae56A96E85EBD774Fe64f44f6EA43784A1441a02",

  //ABIs

  ERC20_ABI: [
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
  ],
  ABI_AIBTC_STAKING_CONCRAT: [
    "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim)",
    "function stake(uint256 amount) external",
    "function calculateReward(address) view returns (uint256)",
    "function currentAPY() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function claim() external",
    "function withdrawPartial(uint256 amount) external",
  ],
  ABI_WRAPPER: [
    "function withdraw(uint256 amount) external",
    "function deposit(uint256 amount) external",
  ],
  ABI_AAVE_USDC_POOL: [
    "function getReserveData(address asset) view returns (tuple(" +
      "tuple(uint256 data) configuration," +
      "uint128 liquidityIndex," +
      "uint128 currentLiquidityRate," +
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
    "function getReserveNormalizedIncome(address asset) view returns (uint256)",
    "function getReservesList() view returns (address[])",
    "function getReservesCount() view returns (uint256)",
  ],
};
