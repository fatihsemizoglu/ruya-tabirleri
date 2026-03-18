import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Dreams API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testDreamId: string;
  let testUserEmail: string;
  let adminUserEmail: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user
    adminUserEmail = `admin-${Date.now()}@example.com`;
    const adminRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: adminUserEmail,
        password: 'adminpass123',
        full_name: 'Admin User'
      }
    });
    const adminRegisterBody = await adminRegisterResponse.json();
    adminToken = adminRegisterBody.data.token;

    // Create regular user
    testUserEmail = `user-${Date.now()}@example.com`;
    const userRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUserEmail,
        password: 'userpass123',
        full_name: 'Regular User'
      }
    });
    const userRegisterBody = await userRegisterResponse.json();
    userToken = userRegisterBody.data.token;

    // Create a test dream as admin
    const dreamResponse = await request.post(`${API_BASE_URL}/dreams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Test Dream',
        slug: `test-dream-${Date.now()}`,
        content: 'This is a test dream content for testing purposes.',
        is_published: true,
        is_featured: true
      }
    });
    const dreamBody = await dreamResponse.json();
    testDreamId = dreamBody.data.id;
  });

  test('GET /api/dreams - should return list of published dreams', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('GET /api/dreams - should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams?page=1&limit=5`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
  });

  test('GET /api/dreams - should filter by category', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams?category_id=test-category`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/dreams - should search dreams', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams?search=test`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/dreams/featured - should return featured dreams', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams/featured`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('GET /api/dreams/:slug - should return dream by slug', async ({ request }) => {
    // First get a dream slug
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamSlug = listBody.data[0].slug;
      const response = await request.get(`${API_BASE_URL}/dreams/${dreamSlug}`);
      
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });

  test('GET /api/dreams/:slug - should return 404 for non-existent dream', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dreams/non-existent-dream`);
    
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/dreams - should create dream with admin token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/dreams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'New Test Dream',
        slug: `new-test-dream-${Date.now()}`,
        content: 'Content of the new test dream.',
        is_published: true
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  test('POST /api/dreams - should reject without auth', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/dreams`, {
      data: {
        title: 'Unauthorized Dream',
        slug: 'unauthorized-dream',
        content: 'This should fail.'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/dreams - should reject regular user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/dreams`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: {
        title: 'User Dream',
        slug: 'user-dream',
        content: 'User should not be able to create dreams.'
      }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PUT /api/dreams/:id - should update dream with admin token', async ({ request }) => {
    // Create a dream first
    const createResponse = await request.post(`${API_BASE_URL}/dreams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Dream to Update',
        slug: `dream-to-update-${Date.now()}`,
        content: 'Original content.'
      }
    });
    const createBody = await createResponse.json();
    const dreamId = createBody.data.id;

    // Update it
    const response = await request.put(`${API_BASE_URL}/dreams/${dreamId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Updated Dream Title'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Dream Title');
  });

  test('DELETE /api/dreams/:id - should delete dream with admin token', async ({ request }) => {
    // Create a dream first
    const createResponse = await request.post(`${API_BASE_URL}/dreams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Dream to Delete',
        slug: `dream-to-delete-${Date.now()}`,
        content: 'This will be deleted.'
      }
    });
    const createBody = await createResponse.json();
    const dreamId = createBody.data.id;

    // Delete it
    const response = await request.delete(`${API_BASE_URL}/dreams/${dreamId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/dreams/:id/like - should like a dream', async ({ request }) => {
    // Get a dream
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamId = listBody.data[0].id;
      
      const response = await request.post(`${API_BASE_URL}/dreams/${dreamId}/like`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST /api/dreams/:id/favorite - should favorite a dream', async ({ request }) => {
    // Get a dream
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamId = listBody.data[0].id;
      
      const response = await request.post(`${API_BASE_URL}/dreams/${dreamId}/favorite`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('GET /api/dreams/:id/comments - should return comments for dream', async ({ request }) => {
    // Get a dream
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamId = listBody.data[0].id;
      
      const response = await request.get(`${API_BASE_URL}/dreams/${dreamId}/comments`);

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    }
  });

  test('POST /api/dreams/:id/comments - should add comment to dream', async ({ request }) => {
    // Get a dream
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamId = listBody.data[0].id;
      
      const response = await request.post(`${API_BASE_URL}/dreams/${dreamId}/comments`, {
        headers: { Authorization: `Bearer ${userToken}` },
        data: {
          content: 'This is a test comment.'
        }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('GET /api/dreams/:id/similar - should return similar dreams', async ({ request }) => {
    // Get a dream
    const listResponse = await request.get(`${API_BASE_URL}/dreams`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const dreamId = listBody.data[0].id;
      
      const response = await request.get(`${API_BASE_URL}/dreams/${dreamId}/similar`);

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    }
  });
});
