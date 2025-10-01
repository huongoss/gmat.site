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
    throw new Error('PASSWORD_DECRYPT_FAIL');
  }
};
