import { base32ToBuf } from './totp.js';

/**
 * Generates an event-based HOTP token for a given counter value.
 * @param {string} secretBase32 - Base32 encoded secret key
 * @param {number|bigint} counter - Incremental event counter (64-bit integer)
 * @param {number} digits - Code length (default: 6)
 * @returns {Promise<string>} - Formatted numeric HOTP code
 */
export async function generateHOTP(secretBase32, counter, digits = 6) {
  const keyBuf = base32ToBuf(secretBase32);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // Convert 64-bit counter to Big-Endian 8-byte ArrayBuffer
  const counterBuffer = new ArrayBuffer(8);
  const dataView = new DataView(counterBuffer);
  dataView.setBigUint64(0, BigInt(counter), false); // Big-Endian byte order

  // Generate HMAC-SHA-1 signature
  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const sigBytes = new Uint8Array(signature);

  // Dynamic Truncation (Extract 31-bit integer from offset)
  const offset = sigBytes[sigBytes.length - 1] & 0x0f;
  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  // Modulo division to retrieve N-digit code
  return (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
}
