import crypto from 'crypto';

let publicKeyPem = process.env.RSA_PUBLIC_KEY || '';
let privateKeyPem = process.env.RSA_PRIVATE_KEY || '';

if (!publicKeyPem || !privateKeyPem) {
  // Dev / fallback: generate ephemeral keys (avoid in production scaling scenarios)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  publicKeyPem = publicKey;
  privateKeyPem = privateKey;
  console.warn('[security] Using ephemeral RSA key pair; set RSA_PUBLIC_KEY/RSA_PRIVATE_KEY for production');
}

export const getPublicKeyPem = () => publicKeyPem;

const fingerprint = (pem: string) => {
  const hash = crypto.createHash('sha256').update(pem).digest('hex');
  return hash.slice(0, 16); // short fingerprint
};

export const getKeyFingerprint = () => fingerprint(publicKeyPem);

export const decryptPassword = (encBase64: string): string => {
  try {
    const buf = Buffer.from(encBase64, 'base64');
    const plain = crypto.privateDecrypt({
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, buf);
    return plain.toString('utf8');
  } catch (e) {
    console.error('[security] PASSWORD_DECRYPT_FAIL', {
      reason: (e as any)?.message,
      keyFp: getKeyFingerprint(),
      cipherLen: encBase64?.length
    });
    throw new Error('PASSWORD_DECRYPT_FAIL');
  }
};
