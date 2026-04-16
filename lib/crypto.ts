/**
 * Utilitários de criptografia client-side para o módulo de senhas.
 *
 * Estratégia:
 *  - PBKDF2 (100k iterações, SHA-256) deriva uma chave AES-256-GCM
 *    a partir da senha mestra + salt aleatório.
 *  - Cada texto é cifrado com AES-GCM e um IV aleatório de 12 bytes.
 *  - O resultado final é: base64(iv[12] + ciphertext).
 *  - A senha mestra NUNCA é armazenada. Para verificá-la, ciframos
 *    um plaintext conhecido (VERIFICATION_PLAINTEXT) e guardamos o
 *    resultado. Ao tentar descriptografar conseguimos saber se a
 *    chave está correta sem expor a senha.
 */

const PBKDF2_ITERATIONS = 100_000
const VERIFICATION_PLAINTEXT = "senhas-vault-verified-v1"

// ── helpers ────────────────────────────────────────────────────────────────

function toBase64(bytes: Uint8Array): string {
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

// ── públicos ───────────────────────────────────────────────────────────────

/** Gera um salt aleatório (16 bytes) codificado em base64. */
export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)))
}

/**
 * Deriva uma chave AES-256-GCM a partir da senha mestra e do salt.
 * Custo intencional: ~200ms em hardware moderno.
 */
export async function deriveKey(
  masterPassword: string,
  saltB64: string
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const raw = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

/** Cifra `text` com a chave e retorna base64(iv + ciphertext). */
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  )
  const out = new Uint8Array(12 + cipher.byteLength)
  out.set(iv)
  out.set(new Uint8Array(cipher), 12)
  return toBase64(out)
}

/**
 * Decifra um valor produzido por `encryptText`.
 * Lança exceção se a chave estiver errada (AES-GCM verifica integridade).
 */
export async function decryptText(
  b64: string,
  key: CryptoKey
): Promise<string> {
  const combined = fromBase64(b64)
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: combined.slice(0, 12) },
    key,
    combined.slice(12)
  )
  return new TextDecoder().decode(plain)
}

/** Cria o token de verificação para armazenar junto ao vault config. */
export async function makeVerificationToken(key: CryptoKey): Promise<string> {
  return encryptText(VERIFICATION_PLAINTEXT, key)
}

/**
 * Retorna `true` se a chave derivada consegue descriptografar o token.
 * Usado para validar a senha mestra sem armazená-la.
 */
export async function verifyMasterKey(
  key: CryptoKey,
  tokenB64: string
): Promise<boolean> {
  try {
    const plain = await decryptText(tokenB64, key)
    return plain === VERIFICATION_PLAINTEXT
  } catch {
    return false
  }
}
