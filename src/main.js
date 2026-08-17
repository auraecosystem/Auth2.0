import { generateTOTP } from './totp.js';

const DEMO_SECRET = 'JBSWY3DPEHPK3PXP'; // Base32 test key

const tokenEl = document.querySelector('.js-token');
const countdownEl = document.querySelector('.js-countdown');

async function render() {
  try {
    const { otp, secondsRemaining } = await generateTOTP(DEMO_SECRET);
    tokenEl.textContent = `${otp.slice(0, 3)} ${otp.slice(3)}`;
    countdownEl.textContent = `${secondsRemaining}s`;
  } catch (err) {
    console.error('TOTP Execution Error:', err);
  }
}

render();
setInterval(render, 1000);
