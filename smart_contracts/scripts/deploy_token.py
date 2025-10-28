import json
from web3 import Web3
from solcx import compile_standard, install_solc
from pathlib import Path
import utils  # il tuo modulo con load_config()

# --- 0. Percorsi e config ---
project_root = Path(__file__).resolve().parent.parent  # da scripts/ a root
config = utils.load_config()

address = config["ADDRESS"]
private_key = config["PRIVATE_KEY"]
provider_url = config["PROVIDER"]

# --- 1. Installa il compilatore corretto ---
install_solc("0.8.20")

# --- 2. Connessione testnet tramite provider ---
w3 = Web3(Web3.HTTPProvider(provider_url))
print("Connessione RPC:", w3.is_connected())

balance = w3.eth.get_balance(address)
print("Saldo (ETH):", w3.from_wei(balance, "ether"))

account = w3.eth.account.from_key(private_key)
from_address = account.address

# --- 3. Leggi il contratto CERToken ---
with open("../contracts/Token.sol", "r") as f:
    contract_source_code = f.read()

# --- 4. Compilazione standard ---
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"Token.sol": {"content": contract_source_code}},
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

# --- 5. Prendi ABI e bytecode ---
contract_data = compiled_sol["contracts"]["Token.sol"]["Token"]
abi = contract_data["abi"]
bytecode = contract_data["evm"]["bytecode"]["object"]

# --- 6. Prepara il contratto per il deploy ---
Token = w3.eth.contract(abi=abi, bytecode=bytecode)

# --- 7. Costruisci la transazione ---
nonce = w3.eth.get_transaction_count(from_address)
transaction = Token.constructor().build_transaction(
    {
        "from": from_address,
        "nonce": nonce,
        "gas": 4000000,  # puoi regolare in base al deploy
        "gasPrice": w3.to_wei("30", "gwei"),
    }
)

# --- 8. Firma la transazione ---
signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)

# --- 9. Invia la transazione ---
tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
print("Deploy in corso, hash:", tx_hash.hex())

# --- 10. Attendi il mining della transazione ---
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
token_address = tx_receipt.contractAddress

print("Contratto deployato all'indirizzo:", tx_receipt.contractAddress)

# --- REGISTRA CONTRATTO ---
utils.register_contract(
    name="Token",
    address=token_address,
    tx_hash=tx_hash.hex(),
    abi=abi,
)
print(f"🧾 Dati salvati in {utils.REGISTRY_PATH}")
