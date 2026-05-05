import { test, expect } from '@playwright/test';

test('admin login returns token', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      email: 'admin@mysticlogbook.com',
      password: 'admin123',
      isAdmin: true
    }
  });
  
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.token).toBeDefined();
});

test('auth/me returns user info', async ({ request }) => {
  // First login to get token
  const loginRes = await request.post('/api/auth/login', {
    data: {
      email: 'admin@mysticlogbook.com',
      password: 'admin123'
    }
  });
  const loginBody = await loginRes.json();
  const token = loginBody.data?.token;
  
  expect(token).toBeDefined();
  
  // Then call /auth/me with token
  const meRes = await request.get('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  expect(meRes.status()).toBe(200);
  const meBody = await meRes.json();
  expect(meBody.success).toBe(true);
  expect(meBody.data.id).toBeDefined();
});