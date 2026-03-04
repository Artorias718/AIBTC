const NETWORKS = {
  // =====================================================
  // BASE SEPOLIA
  // =====================================================
  baseSepolia: {
    READ_RPC: "https://base-sepolia-rpc.publicnode.com",
    CHAIN_ID: "0x14a34", // 84532

    NETWORK_PARAMS: {
      chainId: "0x14a34",
      chainName: "Base Sepolia",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://base-sepolia-rpc.publicnode.com"],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
    },

    // -------- AIBTC --------
    AIBTC_ADDRESS: "0x49252641AC377401Ce4CbAb6500Bb5040c694ff0",
    ICO: "0xF5B4EebE9dD6282f817cCDb0c7d9811A79C967C0",
    AIBTC_STAKING: "0x9955F6b153D8f756CBf4645BeDd562376BC7e22D",

    // -------- USDC --------
    USDC_ADDRESS: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
    AAVE_USDC_WRAPPER: "0x67aF76f4F16dC6189b114686b02ea81551990d32",
    AAVE_USDC_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    AUSDC_ADDRESS: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",

    // -------- USDT --------
    USDT_ADDRESS: "0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a",
    AAVE_USDT_WRAPPER: "0xD272c5dA536651Eba9E17e8926050aea68E5a273",
    AAVE_USDT_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    AUSDT_ADDRESS: "0xcE3CAae5Ed17A7AafCEEbc897DE843fA6CC0c018",

    // -------- WETH --------
    WETH_ADDRESS: "0x4200000000000000000000000000000000000006",
    AAVE_WETH_WRAPPER: "0x74624439A03f77c324bF59d2fFC678f6d12298e7",
    AAVE_WETH_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    aWETH_ADDRESS: "0x73a5bB60b0B0fc35710DDc0ea9c407031E31Bdbb",

    // -------- BTC --------
    BTC_ADDRESS: "0xD171b9694f7A2597Ed006D41f7509aaD4B485c4B",
    AAVE_BTC_WRAPPER: "0x2076c7ee3AeC36E49eBaA50dB8841AA96eEF69Ee",
    AAVE_BTC_POOL: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    aBTC_ADDRESS: "0x9Fd6d1DBAd7c052e0c43f46df36eEc6a68814B63",

    // -------- NFTs --------
    NFT1: "0x4ED7216922e0141177565D3DD9AC2616a53B084f",
    NFT2: "0x075eb9dc52177aa3492e1d26f0fde3d729625d2f",
    NFT3: "0x075eb9dc52177aa3492e1d26f0fde3d729625d2f",
    NFT4: "0x075eb9dc52177aa3492e1d26f0fde3d729625d2f",
  },

  // =====================================================
  // BASE MAINNET
  // =====================================================
  baseMainnet: {
    READ_RPC: "https://mainnet.base.org",
    CHAIN_ID: "0x2105", // 8453

    NETWORK_PARAMS: {
      chainId: "0x2105",
      chainName: "Base",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
    },

    AIBTC_ADDRESS: "0x...",
    ICO: "0x...",
    AIBTC_STAKING: "0x...",

    USDC_ADDRESS: "0x...",
    AAVE_USDC_WRAPPER: "0x...",
    AAVE_USDC_POOL: "0x...",
    AUSDC_ADDRESS: "0x...",

    USDT_ADDRESS: "0x...",
    AAVE_USDT_WRAPPER: "0x...",
    AAVE_USDT_POOL: "0x...",
    AUSDT_ADDRESS: "0x...",

    WETH_ADDRESS: "0x4200000000000000000000000000000000000006",
    AAVE_WETH_WRAPPER: "0x...",
    AAVE_WETH_POOL: "0x...",
    aWETH_ADDRESS: "0x...",

    NFT1: "0x...",
    NFT2: "0x...",
    NFT3: "0x...",
    NFT4: "0x...",
  },
};

const ACTIVE_NETWORK = "baseSepolia";
//const ACTIVE_NETWORK = "baseMainnet";

export const CONFIG = NETWORKS[ACTIVE_NETWORK];

// ================================
// ABIs
// ================================

CONFIG.ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

CONFIG.ABI_AIBTC_STAKING_CONCRAT = [
  "function stakes(address) view returns (uint256 amount, uint256 since, uint256 lastClaim)",
  "function stake(uint256 amount) external",
  "function calculateReward(address) view returns (uint256)",
  "function currentAPY() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function claim() external",
  "function withdrawPartial(uint256 amount) external",
];

CONFIG.ABI_WRAPPER = [
  "function withdraw(uint256 amount) external",
  "function deposit(uint256 amount) external",
];

CONFIG.ABI_AAVE_USDC_POOL = [
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
];
