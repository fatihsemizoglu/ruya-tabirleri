import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Categories API Tests', () => {
  let adminToken: string;
  let userToken: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user
    const adminEmail = `cat-admin-${Date.now()}@example.com`;
    const adminRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: adminEmail,
        password: 'adminpass123',
        full_name: 'Category Admin'
      }
    });
    const adminRegisterBody = await adminRegisterResponse.json();
    adminToken = adminRegisterBody.data.token;

    // Create regular user
    const userEmail = `cat-user-${Date.now()}@example.com`;
    const userRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: userEmail,
        password: 'userpass123',
        full_name: 'Category User'
      }
    });
    const userRegisterBody = await userRegisterResponse.json();
    userToken = userRegisterBody.data.token;
  });

  test('GET /api/categories - should return all categories', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/categories`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('GET /api/categories/:id - should return category by id', async ({ request }) => {
    // First get categories
    const listResponse = await request.get(`${API_BASE_URL}/categories`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const categoryId = listBody.data[0].id;
      const response = await request.get(`${API_BASE_URL}/categories/${categoryId}`);
      
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });

  test('GET /api/categories/:id - should return 404 for non-existent category', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/categories/non-existent-id`);
    
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/categories - should create category with admin token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'Test category description',
        icon: 'star'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  test('POST /api/categories - should reject without auth', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/categories`, {
      data: {
        name: 'Unauthorized Category',
        slug: 'unauthorized-category'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/categories - should reject regular user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: {
        name: 'User Category',
        slug: 'user-category'
      }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PUT /api/categories/:id - should update category', async ({ request }) => {
    // Create a category first
    const createResponse = await request.post(`${API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Category to Update',
        slug: `category-to-update-${Date.now()}`
      }
    });
    const createBody = await createResponse.json();
    const categoryId = createBody.data.id;

    // Update it
    const response = await request.put(`${API_BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Updated Category Name'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/categories/:id - should delete category', async ({ request }) => {
    // Create a category first
    const createResponse = await request.post(`${API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Category to Delete',
        slug: `category-to-delete-${Date.now()}`
      }
    });
    const createBody = await createResponse.json();
    const categoryId = createBody.data.id;

    // Delete it
    const response = await request.delete(`${API_BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/categories/:id - should return 404 for non-existent category', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/categories/non-existent-id`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
