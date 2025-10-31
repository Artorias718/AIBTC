import json
from web3 import Web3
from solcx import compile_standard, install_solc
from pathlib import Path
import utils  # modulo tuo con load_config(), register_contract(), REGISTRY_PATH, load_registry()

# --- 0. Percorsi e config ---
project_root = Path(__file__).resolve().parent.parent
config = utils.load_config()

address = config["ADDRESS"]
private_key = config["PRIVATE_KEY"]
provider_url = config["PROVIDER"]

# --- 1. Carica registry (per leggere indirizzo Staking logico) ---
registry = utils.load_registry()
try:
    STAKING_INFO = registry["CERStakingUpgradeable"]
    LOGIC_ADDRESS = Web3.to_checksum_address(STAKING_INFO["address"])
except KeyError:
    raise SystemExit("❌ ERRORE: CERStaking non presente nel registry.json")

try:
    CER_INFO = registry["Token"]
    CER_ADDRESS = Web3.to_checksum_address(CER_INFO["address"])
except KeyError:
    raise SystemExit("❌ ERRORE: CERToken non presente nel registry.json")

# --- 2. Installa il compilatore corretto ---
install_solc("0.8.22")

# --- 3. Connessione provider ---
w3 = Web3(Web3.HTTPProvider(provider_url))
assert w3.is_connected(), "⚠️ Connessione RPC fallita!"
print("✅ Connesso al nodo RPC")

balance = w3.eth.get_balance(address)
print(f"💰 Saldo (ETH): {w3.from_wei(balance, 'ether')} ETH")

from_address = w3.eth.account.from_key(private_key).address

# --- 4. Leggi sorgente contratto TransparentUpgradeableProxy ---
with open("../contracts/StakingProxy.sol", "r", encoding="utf-8") as f:
    proxy_source_code = f.read()

# --- 5. Compilazione standard ---
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"StakingProxy.sol": {"content": proxy_source_code}},
        "settings": {
            "outputSelection": {"*": {"*": ["abi", "evm.bytecode", "evm.sourceMap"]}}
        },
    },
    solc_version="0.8.22",
    base_path=str(project_root),
    allow_paths=[str(project_root / "node_modules")],
)

# --- 6. Estrai ABI e bytecode ---
proxy_data = compiled_sol["contracts"]["StakingProxy.sol"]["StakingProxy"]
abi = proxy_data["abi"]
bytecode = proxy_data["evm"]["bytecode"]["object"]

# --- 7. Prepara contratto Proxy ---
Proxy = w3.eth.contract(abi=abi, bytecode=bytecode)

# --- 8. Encode initialize della logica ---
# chiama initialize(address,uint256) di Staking
reward_rate = 3170979198  # esempio
# --- Encode initialize della logica usando encodeABI ---
staking_abi = [
    {
        "inputs": [
            {"internalType": "address", "name": "_cerToken", "type": "address"},
            {
                "internalType": "uint256",
                "name": "_rewardRatePerSecond",
                "type": "uint256",
            },
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

# crea contratto fittizio solo per l'encodeABI
StakingContract = w3.eth.contract(address=LOGIC_ADDRESS, abi=staking_abi)

# encodeABI della funzione initialize
init_data = StakingContract.encodeABI(
    fn_name="initialize", args=[CER_ADDRESS, reward_rate]
)
# oppure se vuoi usare signature
# init_data = Proxy.encodeABI(fn_name="initialize", args=[CER_ADDRESS, reward_rate])

# --- 9. Costruisci transazione di deploy ---
nonce = w3.eth.get_transaction_count(from_address)
txn = Proxy.constructor(
    LOGIC_ADDRESS,  # address del logic contract
    from_address,  # admin del proxy
    init_data,  # dati di inizializzazione
).build_transaction(
    {
        "from": from_address,
        "nonce": nonce,
        "gas": 5_000_000,
        "gasPrice": w3.to_wei("30", "gwei"),
    }
)

# --- 10. Firma e invia ---
signed_txn = w3.eth.account.sign_transaction(txn, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
print(f"🚀 Deploy Proxy in corso... TX hash: {tx_hash.hex()}")

# --- 11. Attendi conferma ---
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
proxy_address = tx_receipt.contractAddress
print(f"✅ Proxy deployato all'indirizzo: {proxy_address}")

# --- 12. Registra nel registry ---
utils.register_contract(
    name="CERStakingProxy",
    address=proxy_address,
    tx_hash=tx_hash.hex(),
    abi=abi,
)
print(f"🧾 Dati salvati in {utils.REGISTRY_PATH}")
