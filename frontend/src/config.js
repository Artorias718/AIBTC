// src/config.js
export const CONFIG = {
  //addresses

  AIBTC_ADDRESS: "0x49252641AC377401Ce4CbAb6500Bb5040c694ff0",
  ICO: "0xF5B4EebE9dD6282f817cCDb0c7d9811A79C967C0",

  AIBTC_STAKING: "0x9955F6b153D8f756CBf4645BeDd562376BC7e22D",

  //UDSC
  USDC_ADDRESS: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
  AAVE_USDC_WRAPPER: "0x1e2914892C6a08bAbb52D9a1071FB283D42Df6D1",
  AAVE_USDC_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  AUSDC_ADDRESS: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",

  //USDT
  USDT_ADDRESS: "0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a",
  AAVE_USDT_WRAPPER: "0xD272c5dA536651Eba9E17e8926050aea68E5a273",
  AAVE_USDT_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  AUSDT_ADDRESS: "0xcE3CAae5Ed17A7AafCEEbc897DE843fA6CC0c018",

  //WETH
  WETH_ADDRESS: "0x4200000000000000000000000000000000000006",
  AAVE_WETH_WRAPPER: "0x74624439A03f77c324bF59d2fFC678f6d12298e7",
  AAVE_WETH_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  aWETH_ADDRESS: "0x73a5bB60b0B0fc35710DDc0ea9c407031E31Bdbb",

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
