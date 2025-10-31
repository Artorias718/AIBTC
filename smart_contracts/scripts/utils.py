import json
from web3 import Web3
import os
from pathlib import Path
import sys


REGISTRY_PATH = "./register.json"
CONFIG_FILE = "../config.txt"


def load_config(path: str = CONFIG_FILE) -> dict:
    p = Path(path).expanduser()
    if not p.exists():
        print(f"ERRORE: file non trovato: {p}", file=sys.stderr)
        sys.exit(1)

    config = {}
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            print(f"Riga non valida in {p}: {line}", file=sys.stderr)
            sys.exit(1)
        key, value = line.split("=", 1)
        config[key.strip().upper()] = value.strip()

    # controlla chiavi obbligatorie
    for key in ["ADDRESS", "PRIVATE_KEY", "PROVIDER"]:
        if key not in config:
            print(f"ERRORE: manca {key} in {p}", file=sys.stderr)
            sys.exit(1)

    return config


config = load_config()

provider_url = config["PROVIDER"]

# --- 2. Connessione testnet tramite provider ---
w3 = Web3(Web3.HTTPProvider(provider_url))
print("Connessione RPC:", w3.is_connected())

# ABI minima ERC-20
erc20_abi = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
    },
]


# Restituisce il saldo in ETH di un address.
def get_balance(address: str) -> float:

    if not w3.is_connected():
        raise ConnectionError("⚠️ Connessione al nodo fallita!")

    balance_wei = w3.eth.get_balance(address)
    balance_eth = w3.from_wei(balance_wei, "ether")
    return balance_eth


# Restituisce saldi di tutti i tokens nella lista
def get_balances(address: str, tokens_file: str = "tokens.txt") -> dict:
    """
    Restituisce un dizionario con il saldo ETH e dei token ERC-20 dell'indirizzo.
    """
    if not w3.is_connected():
        raise ConnectionError("⚠️ Connessione al nodo fallita!")

    balances = {}

    # Saldo ETH
    eth_balance = w3.eth.get_balance(address)
    balances["ETH"] = w3.from_wei(eth_balance, "ether")

    # Saldi token ERC-20 nella lista tokens.txt
    with open(tokens_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            name, token_addr = line.split(",")
            token = w3.eth.contract(address=token_addr.strip(), abi=erc20_abi)
            try:
                bal = token.functions.balanceOf(address).call()
                decimals = token.functions.decimals().call()
                balances[name] = bal / (10**decimals)
            except Exception as e:
                balances[name] = f"Errore: {e}"

    return balances


def load_registry():
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, "r") as f:
            return json.load(f)
    return {}


def save_registry(registry):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=4)


def register_contract(name: str, address: str, tx_hash: str, abi: list):
    registry = load_registry()
    registry[name] = {"address": address, "tx_hash": tx_hash, "abi": abi}
    save_registry(registry)


def load_config(path: str = CONFIG_FILE) -> dict:
    p = Path(path).expanduser()
    if not p.exists():
        print(f"ERRORE: file non trovato: {p}", file=sys.stderr)
        sys.exit(1)

    config = {}
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            print(f"Riga non valida in {p}: {line}", file=sys.stderr)
            sys.exit(1)
        key, value = line.split("=", 1)
        config[key.strip().upper()] = value.strip()

    # controlla chiavi obbligatorie
    for key in ["ADDRESS", "PRIVATE_KEY", "PROVIDER"]:
        if key not in config:
            print(f"ERRORE: manca {key} in {p}", file=sys.stderr)
            sys.exit(1)

    return config


def apr_to_reward_rate_per_second(apr):
    """
    Converte un APR (in percentuale, es. 10 per 10%) nel rewardRatePerSecond
    compatibile con lo smart contract.

    Lo smart contract usa la formula:
    reward = amount * rewardRatePerSecond * seconds / 1e18
    """
    seconds_per_year = 365 * 24 * 3600  # 31_536_000
    # rewardRatePerSecond = (APR * amount) / seconds_per_year
    # dividiamo per 100 perché APR è in percentuale
    reward_rate = (apr / 100) * 1e18 / seconds_per_year
    return int(reward_rate)
