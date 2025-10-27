import json
from web3 import Web3
from solcx import compile_standard, install_solc
from pathlib import Path
import utils  # modulo tuo con load_config()

# --- 0. Percorsi e config ---
project_root = Path(__file__).resolve().parent.parent  # scripts/ -> root
config = utils.load_config()
registry = utils.load_registry()


address = config["ADDRESS"]
private_key = config["PRIVATE_KEY"]
provider_url = config["PROVIDER"]

# --- 1. Converti indirizzi in checksum ---
USDT_ADDRESS = Web3.to_checksum_address(config["USDT_ADDRESS"])

try:
    CER_ADDRESS = Web3.to_checksum_address(registry["CERToken"]["address"])
except KeyError as e:
    raise SystemExit(f"❌ ERRORE: Contratto mancante in registry.json: {e}")
# --- 2. Installa il compilatore corretto ---
install_solc("0.8.20")

# --- 3. Connessione alla testnet tramite provider ---
w3 = Web3(Web3.HTTPProvider(provider_url))
print("Connessione RPC:", w3.is_connected())

balance = w3.eth.get_balance(address)
print("Saldo (ETH):", w3.from_wei(balance, "ether"))

account = w3.eth.account.from_key(private_key)
from_address = account.address

# --- 4. Leggi il contratto CERICO ---
with open("../contracts/CERICO.sol", "r") as f:
    contract_source_code = f.read()

# --- 5. Compilazione standard ---
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"CERICO.sol": {"content": contract_source_code}},
        "settings": {
            "outputSelection": {
                "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
            }
        },
    },
    solc_version="0.8.20",
    base_path=str(project_root),
    allow_paths=[str(project_root / "node_modules")],
)

# --- 6. Prendi ABI e bytecode ---
contract_data = compiled_sol["contracts"]["CERICO.sol"]["CERICO"]
abi = contract_data["abi"]
bytecode = contract_data["evm"]["bytecode"]["object"]

# --- 7. Prepara il contratto per il deploy ---
CERICO = w3.eth.contract(abi=abi, bytecode=bytecode)

# --- 8. Costruisci la transazione ---
nonce = w3.eth.get_transaction_count(from_address)
transaction = CERICO.constructor(
    USDT_ADDRESS, CER_ADDRESS  # indirizzi in checksum
).build_transaction(
    {
        "from": from_address,
        "nonce": nonce,
        "gas": 4000000,
        "gasPrice": w3.to_wei("30", "gwei"),
    }
)

# --- 9. Firma la transazione ---
signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)

# --- 10. Invia la transazione ---
tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
print("Deploy in corso, hash:", tx_hash.hex())

# --- 11. Attendi il mining della transazione ---
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("CERICO deployato all'indirizzo:", tx_receipt.contractAddress)

# --- 11. Registra nel registro globale ---
utils.register_contract(
    name="CERICO",
    address=tx_receipt.contractAddress,
    tx_hash=tx_hash.hex(),
    abi=abi,
)
print(f"🧾 Dati salvati in {utils.REGISTRY_PATH}")
