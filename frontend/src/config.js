// src/config.js
export const CONFIG = {
  //addresses

  AIBTC_ADDRESS: "0x20290E5E2E91291EFfe5134d704674380b34e84A",
  USDC_ADDRESS: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
  ICO: "0xe5DCfEfD3B543204812B73C79A703956e5f7fB1F",

  AIBTC_STAKING: "0x46791Cab2f16dC3bdb74729BdB5f7e290A88B0dd",

  //UDSC
  AAVE_USDC_WRAPPER: "0x6E93Edf44CEAA9b36B6a80eBcE63290874Da9075",
  AAVE_USDC_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  AUSDC_ADDRESS: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",

  //USDT
  AAVE_USDT_WRAPPER: "0x547c469E641EC689e109709b975d1f5f211016eE",

  //Mainnet
  // AIBTC_ADDRESS: "0xB84d2F10Be486E8b0170A77b53ff674aaCCC278C",
  // USDT_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  // ICO: "0xae56A96E85EBD774Fe64f44f6EA43784A1441a02",

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
