// Secure Password Hashing & Verification using Node.js crypto.scrypt
// Uses 16-byte random salt, 64-byte derived key, and constant-time timingSafeEqual comparison.

import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return resolve(false);

    const [salt, expectedHex] = parts;
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const expectedBuffer = Buffer.from(expectedHex, 'hex');
        if (expectedBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(expectedBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

