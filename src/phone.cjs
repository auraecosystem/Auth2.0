import { generateTOTP } from './totp.js';

export class PhoneAuthenticator {
  constructor(options = {}) {
    this.secret = options.secret || 'JBSWY3DPEHPK3PXP';
    this.issuer = options.issuer || 'qubuhub';
    this.account = options.account || '123@abc.xyz';

    this.tokenEl = document.querySelector('.js-token');
    this.countdownEl = document.querySelector('.js-countdown');
    this.issuerEl = document.querySelector('.js-issuer');
    this.accountEl = document.querySelector('.js-account-name');
  }

  init() {
    if (this.issuerEl) this.issuerEl.textContent = this.issuer;
    if (this.accountEl) this.accountEl.textContent = this.account;

    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  async tick() {
    try {
      const { otp, secondsRemaining } = await generateTOTP(this.secret);

      if (this.tokenEl) {
        this.tokenEl.textContent = `${otp.slice(0, 3)} ${otp.slice(3)}`;
      }
      if (this.countdownEl) {
        this.countdownEl.textContent = `${secondsRemaining}s`;
      }
    } catch (err) {
      if (this.tokenEl) this.tokenEl.textContent = 'INVALID KEY';
      console.error('TOTP Error:', err);
    }
  }
}

// Auto-initialize from URL query parameters
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const auth = new PhoneAuthenticator({
    secret: urlParams.get('secret'),
    issuer: urlParams.get('issuer'),
    account: urlParams.get('account')
  });
  auth.init();
});
