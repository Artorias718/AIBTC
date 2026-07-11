

# AIBTC
<p align="left">
  <img src="frontend/public/aibtc.png" alt="AIBTC Token" width="120" />
</p>

A DeFi platform built on **Base** (mainnet and Sepolia testnet) around the **AIBTC** ERC-20 token. The project consists of a React frontend, a suite of Solidity smart contracts (Foundry + OpenZeppelin), and a small Python tool for the off-chain handling of encrypted Telegram tags.

## Repository structure

```
AIBTC/
├── frontend/          # React web app (CRA + Tailwind)
├── smart_contracts/   # Solidity contracts, Foundry tests, Python deploy scripts
└── telgram_bot/       # RSA decryption of Telegram tags collected by the frontend
```

---

## Frontend (`frontend/`)

Single-page app built with **Create React App**, styled with **Tailwind CSS** + custom CSS (centralized color palette in `src/styles/`), with on-chain interaction via **ethers.js v5** and browser wallets (MetaMask). Routing is handled by `react-router-dom`.

### Main pages (`src/App.js`)

| Route | Component | Description |
|---|---|---|
| `/` | `Homepage` | Project landing page |
| `/ico` | `ICOPage` | Buy AIBTC with USDC during the ICO; optional collection of the user's Telegram tag (encrypted client-side) |
| `/staking` | `StakingPage` | AIBTC staking and Aave deposits through the wrappers (USDC, WETH, cbBTC) |
| `/lab` | `LabPage` | Mint AIBTC NFTs (requires holding at least 1 AIBTC) |
| `/flip` | `CoinFlip` | Coin flip mini-game |
| `/Luckydrop` | `ComingSoonPage` | "Coming soon" page (with whitepaper and social links) |
| `/swap` | `SwapWidgetCard` | Swap widget |
| `/admin` | `AdminDashboard` | Admin dashboard (rendered without navbar/footer) |
| `/terms`, `/privacy` | `TermsPage`, `PrivacyPage` | Legal pages |
| `*` | `NotFoundPage` | 404 page |

Supporting components: `WalletContext` (shared wallet connection), `NetworkGuard` (enforces the correct network), `Navbar`, `Footer`, `Modal`, `Countdown`, `TransakUSDTArbitrum` (fiat on-ramp via Transak).

### Network configuration (`src/config.js`)

All contract addresses (token, ICO, staking, Aave wrappers, pools, aTokens, NFTs) and the ABIs used by the frontend are centralized in `src/config.js`, with two profiles:

- **`baseMainnet`** (chain id `8453`) — active profile by default
- **`baseSepolia`** (chain id `84532`)

To switch networks, change the `ACTIVE_NETWORK` constant at the bottom of the file.

### Commands

```bash
cd frontend
npm install
npm start        # dev server at http://localhost:3000
npm run build    # production build
npm run deploy   # publish the build to GitHub Pages (gh-pages)
```

---

## Smart contracts (`smart_contracts/`)

**Foundry** environment (`solc 0.8.22`, optimizer enabled) with OpenZeppelin dependencies (standard and upgradeable) as git submodules in `lib/`. Main contracts:

| Contract | Description |
|---|---|
| `TokenV2.sol` | **AIBTC** ERC-20 token — fixed supply of 21,000,000, configurable transfer fee (max 3%, default 1%, disabled by default) with exemptions, one-time and irreversible trading enablement |
| `ICO_Proxy.sol` | Upgradeable ICO (UUPS): USDC deposits → AIBTC distribution at a configurable price, sale start/stop and fund withdrawal by the owner |
| `Staking_ProxyV2.sol` | Upgradeable AIBTC staking (UUPS, pausable): fixed annual reward budget distributed pro-rata to stakers, dynamic APY, 365-day reward window restartable by the owner (`restartRewards`) |
| `Aaave_Generic_wrapper.sol` | Generic Aave v3 wrapper: `deposit`/`withdraw` of an asset with a 0.5% fee sent to `feeRecipient`; the aToken stays in the user's hands (`onBehalfOf`) |
| `Aave_Wrapper*.sol` | Earlier asset-specific wrapper variants (WETH, BTC, USDT) |
| `AIBTC_NFT.sol` | ERC-721 NFT with `publicMint` reserved for holders of at least 1 AIBTC (one mint per address) and an `onlyOwner` administrative mint |
| `WheelGame.sol` | "Wheel of fortune" game: costs 1 AIBTC per spin, emits the `SpinResult` event consumed by the frontend |
| `Token.sol`, `Staking.sol`, `ICO.sol`, `Staking_Proxy*.sol`, `StakingUpgradeable.sol` | Earlier versions / variants of the contracts above |

The production contracts are deployed on **Base mainnet** (addresses in `frontend/src/config.js`).

### Build and test

```bash
cd smart_contracts
git submodule update --init --recursive   # forge-std + OpenZeppelin
forge build
forge test
```

Foundry tests in `test/`: `TokenV2.t.sol`, `ICO_Proxy.t.sol`, `Staking_ProxyV2.t.sol`, `Aave_Wrapper.t.sol`.

### Deploy scripts (`scripts/`)

Python scripts based on **web3.py** for deployment and interaction:

- `deploy_token.py`, `deploy_ico_contract.py`, `deploy_staking.py`, `deploy_proxy_staking.py`, `deply_staking_upgradeable.py`, `deploy_NFT_aibtc.py`, `deploy_wheel.py`
- `main.py` — miscellaneous interactions with the deployed contracts
- `utils.py` — configuration and registry loading
- `register.json` — registry of deployed contract addresses/ABIs

The scripts read credentials from a `config.txt` file (not versioned) placed in `smart_contracts/`, in the format:

```
ADDRESS=0x...
PRIVATE_KEY=0x...
PROVIDER=https://...
```

Python requirements: `web3`.

---

## Encrypted Telegram tags (`telgram_bot/`)

During the ICO the frontend can collect the user's Telegram tag, encrypting it **client-side** with RSA (public key in `frontend/src/utils/encryption.js`, via `jsencrypt`). The `telgram_bot/decrypter.py` script decrypts the tags off-chain using the private key (`private.pem`, not versioned):

```bash
cd telgram_bot
python decrypter.py   # reads ../../tag.b64, writes plaintext.txt
```

Python requirements: `cryptography`.

---

## Notes

- The Aave wrapper fees (0.5%) and the token transfer fee go to the `feeRecipient`/`feeCollector` configured at deploy time.
- The whitepaper is available at `frontend/public/Whitepaper.pdf` and linked from the coming-soon page.
- In `config.js` the mainnet BTC block uses **cbBTC** (Coinbase Wrapped BTC) — the internal naming is being refactored.
