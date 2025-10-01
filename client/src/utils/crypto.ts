// Client-side RSA-OAEP password encryption helper
// Fetches public key once from /api/auth/public-key and caches CryptoKey

let keyPromise: Promise<CryptoKey> | null = null;

async function fetchPublicKeyPem(): Promise<string> {
  const res = await fetch('/api/auth/public-key');
  if (!res.ok) throw new Error('Failed to fetch public key');
  const json = await res.json();
  if (!json.publicKey) throw new Error('Public key missing in response');
  return json.publicKey as string;
}

async function importKey(): Promise<CryptoKey> {
  const pem = await fetchPublicKeyPem();
  const cleaned = pem.replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

async function getKey(): Promise<CryptoKey> {
  if (!keyPromise) keyPromise = importKey();
  return keyPromise;
}

export async function encryptPassword(plain: string): Promise<string> {
  if (!plain) throw new Error('Missing password');
  try {
    const key = await getKey();
    const data = new TextEncoder().encode(plain);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (e) {
    console.warn('[crypto] Encryption failed, falling back to plaintext submit', e);
    throw e; // let caller decide fallback vs abort
  }
}
