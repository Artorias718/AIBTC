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

registry = utils.load_registry()
try:
    CER_INFO = registry["Token"]
    CER_ADDRESS = Web3.to_checksum_address(CER_INFO["address"])


except KeyError:
    raise SystemExit("❌ ERRORE: CERToken non presente nel registry.json")


# --- 1. Connessione provider ---
w3 = Web3(Web3.HTTPProvider(provider_url))
assert w3.is_connected(), "⚠️ Connessione RPC fallita!"
print("✅ Connesso al nodo RPC")

balance = w3.eth.get_balance(address)
print(f"💰 Saldo (ETH): {w3.from_wei(balance, 'ether')} ETH")

from_address = w3.eth.account.from_key(private_key).address

# --- 2. Installa il compilatore corretto ---
install_solc("0.8.22")

# --- 3. Leggi sorgente contratto NFT ---
with open("../contracts/AIBTC_NFT.sol", "r", encoding="utf-8") as f:
    contract_source_code = f.read()

# --- 4. Compilazione standard ---
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"AIBTC_NFT.sol": {"content": contract_source_code}},
        "settings": {
            "outputSelection": {"*": {"*": ["abi", "evm.bytecode", "evm.sourceMap"]}}
        },
    },
    solc_version="0.8.22",
    base_path=str(project_root),
    allow_paths=[str(project_root / "node_modules")],
)

# --- 5. Estrai ABI e bytecode ---
contract_data = compiled_sol["contracts"]["AIBTC_NFT.sol"]["AIBTC_NFT"]
abi = contract_data["abi"]
bytecode = contract_data["evm"]["bytecode"]["object"]

# --- 6. Prepara contratto ---
MyNFT = w3.eth.contract(abi=abi, bytecode=bytecode)

# --- 7. Costruisci transazione di deploy con baseURI ---
nonce = w3.eth.get_transaction_count(from_address)
base_uri = (
    "https://ipfs.io/ipfs/bafkreidau7fnv3jcgwarcrzb34lrmquvttcwvvzdjna4uovpccbtdkdf64"
)

txn = MyNFT.constructor(
    "MyBonusNFT",  # nome della collezione
    "MBNFT",  # simbolo
    base_uri,
    CER_ADDRESS,  # baseURI del JSON
).build_transaction(
    {
        "from": from_address,
        "nonce": nonce,
        "gas": 4_000_000,
        "gasPrice": w3.to_wei("30", "gwei"),
    }
)

# --- 8. Firma e invia ---
signed_txn = w3.eth.account.sign_transaction(txn, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
print(f"🚀 Deploy in corso... TX hash: {tx_hash.hex()}")

# --- 9. Attendi conferma ---
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
nft_address = tx_receipt.contractAddress
print(f"✅ NFT deployato all'indirizzo: {nft_address}")

# --- 10. Registra nel registro globale ---
utils.register_contract(
    name="AIBTC_NFT",
    address=nft_address,
    tx_hash=tx_hash.hex(),
    abi=abi,
)
print(f"🧾 Dati salvati in {utils.REGISTRY_PATH}")
