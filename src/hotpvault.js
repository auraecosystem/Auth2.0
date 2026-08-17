import { generateHOTP } from './hotp.js';

const DB_NAME = 'Auth2VaultDB';
const STORE_NAME = 'hotp_tokens';
const DB_VERSION = 1;

/**
 * Initializes and opens the IndexedDB database instance
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Encrypts a payload object using AES-GCM
 */
async function encryptPayload(data, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  return {
    ciphertext: Array.from(new Uint8Array(ciphertext)),
    iv: Array.from(iv)
  };
}

/**
 * Decrypts an AES-GCM payload object
 */
async function decryptPayload(encrypted, aesKey) {
  const ciphertext = new Uint8Array(encrypted.ciphertext).buffer;
  const iv = new Uint8Array(encrypted.iv);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Stores a new HOTP account in IndexedDB with an initial counter of 0
 */
export async function saveHOTPAccount(accountId, secretBase32, aesKey) {
  const db = await openDB();
  const encrypted = await encryptPayload({ secretBase32, counter: 0 }, aesKey);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ id: accountId, encrypted, updatedAt: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Atomically generates an HOTP code and increments the stored counter in IndexedDB
 */
export async function consumeHOTPCode(accountId, aesKey) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(accountId);

    getReq.onsuccess = async () => {
      const record = getReq.result;
      if (!record) {
        reject(new Error(`Account "${accountId}" not found.`));
        return;
      }

      try {
        // 1. Decrypt stored secret and active counter
        const payload = await decryptPayload(record.encrypted, aesKey);
        const { secretBase32, counter } = payload;

        // 2. Compute the current HOTP token
        const code = await generateHOTP(secretBase32, counter);

        // 3. Increment counter and re-encrypt payload
        const updatedPayload = { secretBase32, counter: counter + 1 };
        record.encrypted = await encryptPayload(updatedPayload, aesKey);
        record.updatedAt = Date.now();

        // 4. Save updated counter back to IndexedDB inside same transaction
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve({ code, counterUsed: counter, nextCounter: counter + 1 });
        putReq.onerror = () => reject(putReq.error);

      } catch (err) {
        reject(err);
      }
    };

    getReq.onerror = () => reject(getReq.error);
  });
}
