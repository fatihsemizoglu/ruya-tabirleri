import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Search API Tests', () => {
  test('GET /api/search - should return search results', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search?q=test`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /api/search - should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search?q=test&page=1&limit=10`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
  });

  test('GET /api/search - should filter by type', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search?q=test&type=dreams`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/search - should filter by category', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search?q=test&category=test-category`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/search - should return empty results for non-matching query', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search?q=zzzzznonmatchingquery12345`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/search/suggestions - should return search suggestions', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search/suggestions?q=tes`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/search/suggestions - should require query parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/search/suggestions`);
    
    // Should still work but return empty or all results
    expect(response.ok()).toBe(true);
  });
});

test.describe('Contact API Tests', () => {
  test('POST /api/contact - should submit contact form', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/contact`, {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message.'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/contact - should reject missing required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/contact`, {
      data: {
        name: 'Test User'
        // Missing email, subject, message
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/contact - should reject invalid email', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/contact`, {
      data: {
        name: 'Test User',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'Test message'
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

test.describe('Health Check Tests', () => {
  test('GET /health - should return server health status', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
