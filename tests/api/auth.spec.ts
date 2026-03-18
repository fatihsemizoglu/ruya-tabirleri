import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Authentication API Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User'
  };

  test('POST /api/auth/register - should register a new user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data).toHaveProperty('user');
    expect(body.data.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/register - should reject duplicate email', async ({ request }) => {
    // First registration
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });

    // Duplicate registration
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('already registered');
  });

  test('POST /api/auth/register - should reject invalid email', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: 'invalid-email',
        password: testUser.password
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  test('POST /api/auth/register - should reject short password', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: 'test2@example.com',
        password: '123'
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/auth/login - should login with valid credentials', async ({ request }) => {
    // First register a user
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });

    // Then login
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/login - should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid');
  });

  test('POST /api/auth/login - should reject missing email', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        password: 'testpassword'
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/auth/me - should return user info with valid token', async ({ request }) => {
    // Register and get token
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.data.token;

    // Get current user
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(testUser.email);
  });

  test('GET /api/auth/me - should reject request without token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PUT /api/auth/profile - should update user profile', async ({ request }) => {
    // Register and get token
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.data.token;

    // Update profile
    const response = await request.put(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        full_name: 'Updated Name',
        username: 'updateduser',
        bio: 'Test bio'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('PUT /api/auth/password - should change password', async ({ request }) => {
    // Register and get token
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.data.token;

    // Change password
    const response = await request.put(`${API_BASE_URL}/auth/password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        current_password: testUser.password,
        new_password: 'newpassword123'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify new password works
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: 'newpassword123'
      }
    });
    expect(loginResponse.ok()).toBe(true);
  });

  test('PUT /api/auth/password - should reject incorrect current password', async ({ request }) => {
    // Register and get token
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.data.token;

    // Try to change password with wrong current password
    const response = await request.put(`${API_BASE_URL}/auth/password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        current_password: 'wrongpassword',
        new_password: 'newpassword123'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('incorrect');
  });

  test('POST /api/auth/logout - should logout successfully', async ({ request }) => {
    // Register and get token
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.fullName
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.data.token;

    // Logout
    const response = await request.post(`${API_BASE_URL}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
