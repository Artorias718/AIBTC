from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
import base64

# --- Configura qui il percorso dei file ---
private_key_file = "../../private.pem"
ciphertext_file = "../../tag.b64"
output_file = "plaintext.txt"

# --- Carica la chiave privata ---
with open(private_key_file, "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
    )

# --- Leggi il ciphertext e decodifica base64 ---
with open(ciphertext_file, "rb") as f:
    ciphertext_b64 = f.read()
ciphertext = base64.b64decode(ciphertext_b64)

# --- Decifra ---
plaintext = private_key.decrypt(ciphertext, padding.PKCS1v15())

# --- Salva il risultato ---
with open(output_file, "wb") as f:
    f.write(plaintext)

print("Decifratura completata! Contenuto salvato in", output_file)
