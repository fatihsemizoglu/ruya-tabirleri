const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function test() {
const BASE = process.env.API_BASE_URL || 'https://ruya-tabirleri.vercel.app';
  try {
    const healthUrl = `${BASE}/api/health`;
    const r = await fetch(healthUrl);
    const text = await r.text();
    console.log('Health response status:', r.status);
    console.log('Health response body (text):', text.substring(0, 200));
  } catch (e) {
    console.error('Health test error:', e);
  }
}
test();
