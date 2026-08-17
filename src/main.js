import { deriveKey } from './vault.js';
import { saveHOTPAccount, consumeHOTPCode } from './hotpVault.js';

async function init() {
  // Derive a master encryption key from user PIN/Passphrase
  const masterKey = await deriveKey('user-passphrase-123', 'unique-salt-val');
  const accountId = 'user@qubuhub.com';

  // 1. Register new account (Secret: JBSWY3DPEHPK3PXP)
  await saveHOTPAccount(accountId, 'JBSWY3DPEHPK3PXP', masterKey);

  // 2. User clicks "Generate Code" button
  document.querySelector('#generate-btn').addEventListener('click', async () => {
    try {
      const { code, counterUsed, nextCounter } = await consumeHOTPCode(accountId, masterKey);
      
      console.log(`HOTP Code: ${code}`);
      console.log(`Counter used: ${counterUsed} | Next counter: ${nextCounter}`);
    } catch (err) {
      console.error('Failed to generate HOTP:', err);
    }
  });
}

init();
