import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Admin API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let moderatorToken: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user
    const adminEmail = `admin-test-${Date.now()}@example.com`;
    const adminRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: adminEmail,
        password: 'adminpass123',
        full_name: 'Admin User'
      }
    });
    const adminRegisterBody = await adminRegisterResponse.json();
    adminToken = adminRegisterBody.data.token;

    // Create regular user
    const userEmail = `regular-user-${Date.now()}@example.com`;
    const userRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: userEmail,
        password: 'userpass123',
        full_name: 'Regular User'
      }
    });
    const userRegisterBody = await userRegisterResponse.json();
    userToken = userRegisterBody.data.token;

    // Create moderator user
    const modEmail = `mod-user-${Date.now()}@example.com`;
    const modRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: modEmail,
        password: 'modpass123',
        full_name: 'Moderator User'
      }
    });
    const modRegisterBody = await modRegisterResponse.json();
    moderatorToken = modRegisterBody.data.token;
  });

  test('GET /api/admin/statistics - should return dashboard statistics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty('totalDreams');
    expect(body.data).toHaveProperty('totalUsers');
  });

  test('GET /api/admin/statistics - should reject without auth', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/statistics`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/admin/statistics - should reject regular user', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/statistics`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/admin/users - should return list of users (admin only)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.pagination).toBeDefined();
  });

  test('GET /api/admin/users - should reject moderator', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${moderatorToken}` }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PUT /api/admin/users/:id/role - should update user role', async ({ request }) => {
    // Get a user (regular user)
    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersBody = await usersResponse.json();
    
    if (usersBody.data.length > 1) {
      const userId = usersBody.data[1].id; // Skip the admin user
      
      const response = await request.put(`${API_BASE_URL}/admin/users/${userId}/role`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { role: 'moderator' }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('PUT /api/admin/users/:id/role - should reject invalid role', async ({ request }) => {
    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersBody = await usersResponse.json();
    
    if (usersBody.data.length > 1) {
      const userId = usersBody.data[1].id;
      
      const response = await request.put(`${API_BASE_URL}/admin/users/${userId}/role`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { role: 'invalid-role' }
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    }
  });

  test('DELETE /api/admin/users/:id - should delete user', async ({ request }) => {
    // Create a user to delete
    const userToDeleteEmail = `todelete-${Date.now()}@example.com`;
    const createResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: userToDeleteEmail,
        password: 'deletepass123',
        full_name: 'To Delete'
      }
    });
    const createBody = await createResponse.json();
    const userId = createBody.data.user.id;

    // Delete the user
    const response = await request.delete(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/admin/users/:id - should reject deleting own account', async ({ request }) => {
    // Try to delete the admin's own account
    // First get the admin's user id from /auth/me
    const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const meBody = await meResponse.json();
    const adminId = meBody.data.id;

    const response = await request.delete(`${API_BASE_URL}/admin/users/${adminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Cannot delete');
  });

  test('GET /api/admin/comments - should return comments', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('GET /api/admin/comments - should filter by status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/comments?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('PUT /api/admin/comments/:id/approve - should approve comment', async ({ request }) => {
    // First get a comment
    const commentsResponse = await request.get(`${API_BASE_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const commentsBody = await commentsResponse.json();
    
    if (commentsBody.data.length > 0) {
      const commentId = commentsBody.data[0].id;
      
      const response = await request.put(`${API_BASE_URL}/admin/comments/${commentId}/approve`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('PUT /api/admin/comments/:id/reject - should reject comment', async ({ request }) => {
    // First get a comment
    const commentsResponse = await request.get(`${API_BASE_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const commentsBody = await commentsResponse.json();
    
    if (commentsBody.data.length > 0) {
      const commentId = commentsBody.data[0].id;
      
      const response = await request.put(`${API_BASE_URL}/admin/comments/${commentId}/reject`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('DELETE /api/admin/comments/:id - should delete comment', async ({ request }) => {
    // First get a comment
    const commentsResponse = await request.get(`${API_BASE_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const commentsBody = await commentsResponse.json();
    
    if (commentsBody.data.length > 0) {
      const commentId = commentsBody.data[0].id;
      
      const response = await request.delete(`${API_BASE_URL}/admin/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('GET /api/admin/contact-messages - should return contact messages', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/contact-messages`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /api/admin/contact-messages - should reject non-admin', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/contact-messages`, {
      headers: { Authorization: `Bearer ${moderatorToken}` }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/admin/audit-logs - should return audit logs', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/admin/audit-logs - should search audit logs', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/audit-logs?search=test`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/admin/category-stats - should return category statistics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/category-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/admin/top-dreams - should return top dreams', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/top-dreams`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });
});
