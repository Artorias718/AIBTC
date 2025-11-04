// src/utils/encryption.js
import JSEncrypt from "jsencrypt";

// Chiave pubblica del tuo servizio (public.pem)
const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1t1+NjPnl5wRwLgERcY5
0iZUr1e1M1Bf6JOgObGAsX6Nrz57KaR5uDqbhg2psY80WJSsPPa0TH6XHBomfRtL
mP2sxRL3VVl8dyZoJ/qiT/aPvwP1yv0AGNx1cAaKUeLK9RFyJq9nkf0iklR6fQN9
xUcL2rwOAdRhYXFQLdzCZVA6Dfxq7pQyJ9Ycb0IMfo6npIPEja+bCklzxs1HpgZX
fTs9uCUVankBX8/fjXhDPlIIbq5CxUY3ucD1rV0AZzArMhEQ8ny71sH42Z7o5u8F
BsBmqKL3HpcaYEHotZIMZfggCYW4bkjokOox+SEstv676Y30zcLePxIRl31EBf+g
cQIDAQAB
-----END PUBLIC KEY-----
`;

export function encryptTelegramTag(tag) {
  if (!tag || tag.trim() === "") return "";
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(PUBLIC_KEY);
  const encrypted = encrypt.encrypt(tag);
  return encrypted || "";
}
