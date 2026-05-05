#!/usr/bin/env node
// Phase 2 - lightweight endpoints health + login test script (ESM)
import fetch from 'node-fetch';

const BASE = process.env.API_BASE_URL || 'https://ruya-tabirleri.vercel.app/api';

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, json: text }; }
}

async function getJson(url) {
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, json: text }; }
}

(async () => {
  console.log('Phase 2 health check...');
  const health = await getJson(BASE + '/health');
  console.log('Health:', health.status, health.json);

  console.log('Attempting admin login...');
  const login = await postJson(BASE + '/auth/login', {
    email: 'admin@mysticlogbook.com',
    password: 'admin123',
    isAdmin: true
  });
  console.log('Login response:', login);

  if (login.ok && login.json && login.json.data && login.json.data.token) {
    const token = login.json.data.token;
    console.log('Attempting /auth/me with token...')
    const me = await fetch(`${BASE.replace(/api$/, '')}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meText = await me.text();
    console.log('Me response status:', me.status, 'body:', meText);
  }
})();
