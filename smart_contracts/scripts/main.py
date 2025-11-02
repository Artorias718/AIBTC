import json
from web3 import Web3
from pathlib import Path
import utils  # modulo tuo con load_config()

# --- 0. Config ---
config = utils.load_config()
registry = utils.load_registry()  # ✅ nuovo


address = config["ADDRESS"]
private_key = config["PRIVATE_KEY"]
provider_url = config["PROVIDER"]

# --- 1. Connessione alla testnet ---
w3 = Web3(Web3.HTTPProvider(provider_url))
print("Connessione RPC:", w3.is_connected())

balance = w3.eth.get_balance(address)
print("Saldo (ETH):", w3.from_wei(balance, "ether"))

from_address = w3.eth.account.from_key(private_key).address

# --- 2. Converti indirizzi in checksum ---
USDT_ADDRESS = Web3.to_checksum_address(config["USDT_ADDRESS"])

# --- 2. Recupera indirizzi da registry ---
try:
    CER_INFO = registry["Token"]
    CERICO_INFO = registry["CERICO"]
    CER_STAKING_INFO = registry["CERStaking"]
    CER_STAKING_PROXY_INFO = registry["CERStakingProxy"]


except KeyError as e:
    raise SystemExit(f"❌ ERRORE: Contratto mancante in registry.json: {e}")

CER_ADDRESS = Web3.to_checksum_address(CER_INFO["address"])
CERICO_ADDRESS = Web3.to_checksum_address(CERICO_INFO["address"])
CERSTAKING_ADDRESS = Web3.to_checksum_address(CER_STAKING_INFO["address"])
CERSTAKINGPROXY_ADDRESS = Web3.to_checksum_address(CER_STAKING_PROXY_INFO["address"])


CER_ABI = CER_INFO["abi"]
CERICO_ABI = CERICO_INFO["abi"]
CERSTAKING_ABI = CER_STAKING_INFO["abi"]
CERSTAKINGPROXY_ABI = CER_STAKING_PROXY_INFO["abi"]


# --- 3. ABI standard ERC20 ---
erc20_abi = json.loads(
    '[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"}]'
)

# --- 4. Contratti ---
usdt_contract = w3.eth.contract(address=USDT_ADDRESS, abi=erc20_abi)

cer_contract = w3.eth.contract(address=CER_ADDRESS, abi=CER_ABI)

cerico_contract = w3.eth.contract(address=CERICO_ADDRESS, abi=CERICO_ABI)

cer_staking = w3.eth.contract(address=CERSTAKING_ADDRESS, abi=CERSTAKING_ABI)

cer_staking_proxy = w3.eth.contract(address=CERSTAKINGPROXY_ADDRESS, abi=CERSTAKING_ABI)


# --- 5. Funzioni di utilità ---
def send_cer_to_contract(amount):
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_contract.functions.transfer(CERICO_ADDRESS, amount).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Trasferimento CER: {tx_hash.hex()}")


def approve_and_deposit_usdt(amount):
    # Approva
    nonce = w3.eth.get_transaction_count(from_address)
    approve_txn = usdt_contract.functions.approve(
        CERICO_ADDRESS, amount
    ).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_approve = w3.eth.account.sign_transaction(approve_txn, private_key)
    tx_hash_approve = w3.eth.send_raw_transaction(signed_approve.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash_approve)
    print(f"Approval USDT: {tx_hash_approve.hex()}")

    # Deposita
    nonce = w3.eth.get_transaction_count(from_address)
    deposit_txn = cerico_contract.functions.deposit(amount).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_deposit = w3.eth.account.sign_transaction(deposit_txn, private_key)
    tx_hash_deposit = w3.eth.send_raw_transaction(signed_deposit.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash_deposit)
    print(f"Deposit USDT: {tx_hash_deposit.hex()}")


def withdraw_usdt_from_contract(amount):
    """
    Esegue la funzione withdrawUSDT del contratto CERICO.
    Solo l'owner del contratto può farlo.
    """

    # 1. Calcola il nonce per l'account che esegue la transazione
    nonce = w3.eth.get_transaction_count(from_address)

    # 2. Costruisce la transazione per chiamare withdrawUSDT(uint256)
    txn = cerico_contract.functions.withdrawUSDT(amount).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 150000,  # leggermente più alto del solito per sicurezza
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )

    # 3. Firma la transazione con la chiave privata dell’owner
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)

    # 4. Invia la transazione sulla rete
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

    # 5. Attende la conferma
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    # 6. Stampa il risultato
    print(f"Prelievo USDT completato. TX hash: {tx_hash.hex()}")
    print(f"Stato transazione: {receipt.status}")


# --- Funzioni staking CER ---


def approve_staking(amount):
    """
    Approva il contratto di staking a spendere i tuoi CER.
    amount deve essere in wei (es: 100 * 10**18 per 100 CER)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_contract.functions.approve(CERSTAKING_ADDRESS, amount).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )

    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Approval completata: {tx_hash.hex()} (status={receipt.status})")


def stake_tokens(amount, telegram_tag=""):
    """
    Effettua lo stake di 'amount' CER nel contratto CERStaking.
    amount deve essere espresso con i decimali del token (es. 18 per CER).
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking.functions.stake(amount, telegram_tag).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 200_000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Stake effettuato: {tx_hash.hex()}")


def claim_rewards():
    """
    Effettua il claim dei reward accumulati senza ritirare lo stake.
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking.functions.claim().build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 150_000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Reward claim completato: {tx_hash.hex()}")


def set_reward_rate(rate):
    """
    Modifica il rewardRate nel contratto di staking.
    rate è in wei per token per secondo (es: 1e18 = 1 CER/s per ogni CER stakato)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking.functions.setRewardRate(rate).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(
        f"✅ Reward rate impostato a {rate / 1e18:.4f} CER/s per token. TX: {tx_hash.hex()}"
    )


def send_cer_to_staking(amount):
    """
    Invia CER al contratto di staking (per finanziare le ricompense)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_contract.functions.transfer(CERSTAKING_ADDRESS, amount).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Inviati {amount / 1e18} CER allo staking. TX: {tx_hash.hex()}")


def get_all_stakes():

    all_stakes = []

    # Ottieni tutti gli staker
    stakers = cer_staking.functions.getStakers().call()

    for user in stakers:
        stake_info = cer_staking.functions.stakes(user).call()
        all_stakes.append(
            {
                "address": user,
                "amount": stake_info[0] / 10**18,  # converte da wei a CER
                "since": stake_info[1],
                "lastClaim": stake_info[2],
                "telegramTag": stake_info[3],
            }
        )

    return all_stakes


def withdraw_stake():
    """
    Chiama la funzione withdraw() del contratto per ritirare
    stake + reward dell'utente.
    """
    nonce = w3.eth.get_transaction_count(from_address)

    txn = cer_staking.functions.withdraw().build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 200_000,  # stimato, puoi regolare
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )

    # Firma la transazione
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)

    # Invia la transazione
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

    # Attendi la conferma
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    print(f"✅ Withdraw completato! TX: {tx_hash.hex()}")


# --- Funzioni staking CER tramite proxy ---


def send_cer_to_staking_proxy(amount):
    """
    Invia CER al contratto di staking (per finanziare le ricompense)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_contract.functions.transfer(
        CERSTAKINGPROXY_ADDRESS, amount
    ).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Inviati {amount / 1e18} CER allo staking. TX: {tx_hash.hex()}")


def approve_staking_proxy(amount):
    """
    Approva il contratto di staking a spendere i tuoi CER.
    amount deve essere in wei (es: 100 * 10**18 per 100 CER)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_contract.functions.approve(
        CERSTAKINGPROXY_ADDRESS, amount
    ).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )

    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Approval completata: {tx_hash.hex()} (status={receipt.status})")


def stake_tokens_proxy(amount, telegram_tag=""):
    """
    Effettua lo stake di 'amount' CER nel contratto CERStaking.
    amount deve essere espresso con i decimali del token (es. 18 per CER).
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking_proxy.functions.stake(amount, telegram_tag).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 200_000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Stake effettuato: {tx_hash.hex()}")


def claim_rewards_proxy():
    """
    Effettua il claim dei reward accumulati senza ritirare lo stake.
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking_proxy.functions.claim().build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 150_000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Reward claim completato: {tx_hash.hex()}")


def set_reward_rate_proxy(rate):
    """
    Modifica il rewardRate nel contratto di staking.
    rate è in wei per token per secondo (es: 1e18 = 1 CER/s per ogni CER stakato)
    """
    nonce = w3.eth.get_transaction_count(from_address)
    txn = cer_staking_proxy.functions.setRewardRate(rate).build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(
        f"✅ Reward rate impostato a {rate / 1e18:.4f} CER/s per token. TX: {tx_hash.hex()}"
    )


def get_all_stakes_proxy():

    all_stakes = []

    # Ottieni tutti gli staker
    stakers = cer_staking_proxy.functions.getStakers().call()

    for user in stakers:
        stake_info = cer_staking_proxy.functions.stakes(user).call()
        all_stakes.append(
            {
                "address": user,
                "amount": stake_info[0] / 10**18,  # converte da wei a CER
                "since": stake_info[1],
                "lastClaim": stake_info[2],
                "telegramTag": stake_info[3],
            }
        )

    return all_stakes


def withdraw_stake_proxy():
    """
    Chiama la funzione withdraw() del contratto per ritirare
    stake + reward dell'utente.
    """
    nonce = w3.eth.get_transaction_count(from_address)

    txn = cer_staking_proxy.functions.withdraw().build_transaction(
        {
            "from": from_address,
            "nonce": nonce,
            "gas": 200_000,  # stimato, puoi regolare
            "gasPrice": w3.to_wei("30", "gwei"),
        }
    )

    # Firma la transazione
    signed_txn = w3.eth.account.sign_transaction(txn, private_key)

    # Invia la transazione
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

    # Attendi la conferma
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    print(f"✅ Withdraw completato! TX: {tx_hash.hex()}")


# --- 6. MAIN ---
if __name__ == "__main__":
    # Trasferisci 100.000 CER al contratto della ICO
    # send_cer_to_contract(100_000 * 10**18)  # CER con 18 decimali

    # manda USDC al contratto ICO per comprare CER
    # approve_and_deposit_usdt(1 * 10**6)  # USDT con 6 decimali

    # prelievo di emergenza di USDT dal contratto ICO
    # withdraw_usdt_from_contract(3 * 10**6)

    send_cer_to_staking(10000 * 10**18)  # Invia 1000 CER al contratto di staking
    approve_staking(1000 * 10**18)

    stake_tokens(1 * 10**18, "bear")  # staking di 1 CER

    # rr = utils.apr_to_reward_rate_per_second(280)
    # set_reward_rate(rr)

    # send_cer_to_staking(10000 * 10**18)  # Invia 1000 CER al contratto di staking

    stakes = get_all_stakes()
    for s in stakes:
        print(s)
    claim_rewards()

    withdraw_stake()

    # 1. Quanto c'è nel contratto
    balance = cer_contract.functions.balanceOf(CERSTAKING_ADDRESS).call()
    print("Saldo CER contratto:", balance / 1e18)

    # 3. Reward calcolato
    reward = cer_staking.functions.calculateReward(from_address).call()
    print("Reward maturato:", reward / 1e18)

    stakes = get_all_stakes()
    for s in stakes:
        print(s)

    # ****************** PROXY
    # send_cer_to_staking_proxy(10000 * 10**18)  # Invia 1000 CER al contratto di staking
    # approve_staking_proxy(1000 * 10**18)
    # stake_tokens_proxy(1 * 10**18, "bear")  # staking di 1 CER

    # # # # 1. Quanto c'è nel contratto
    # balance = cer_contract.functions.balanceOf(CERSTAKINGPROXY_ADDRESS).call()
    # print("Saldo CER contratto:", balance / 1e18)

    # # # 3. Reward calcolato
    # reward = cer_staking_proxy.functions.calculateReward(from_address).call()
    # print("Reward maturato:", reward / 1e18)
