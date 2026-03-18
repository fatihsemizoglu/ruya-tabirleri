import { test, expect } from '../fixtures/test-utils';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Blog API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testPostId: string;
  let testUserEmail: string;
  let adminUserEmail: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user
    adminUserEmail = `blog-admin-${Date.now()}@example.com`;
    const adminRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: adminUserEmail,
        password: 'adminpass123',
        full_name: 'Blog Admin'
      }
    });
    const adminRegisterBody = await adminRegisterResponse.json();
    adminToken = adminRegisterBody.data.token;

    // Create regular user
    testUserEmail = `blog-user-${Date.now()}@example.com`;
    const userRegisterResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: testUserEmail,
        password: 'userpass123',
        full_name: 'Blog User'
      }
    });
    const userRegisterBody = await userRegisterResponse.json();
    userToken = userRegisterBody.data.token;

    // Create a test blog post as admin
    const postResponse = await request.post(`${API_BASE_URL}/blog/posts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Test Blog Post',
        slug: `test-blog-post-${Date.now()}`,
        content: 'This is a test blog post content for testing purposes.',
        is_published: true,
        is_featured: true
      }
    });
    const postBody = await postResponse.json();
    testPostId = postBody.data.id;
  });

  test('GET /api/blog/posts - should return list of published posts', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/posts`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('GET /api/blog/posts - should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/posts?page=1&limit=5`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
  });

  test('GET /api/blog/posts - should filter by category', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/posts?category_id=test-category`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/blog/posts - should filter by tag', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/posts?tag=test`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/blog/posts/:slug - should return post by slug', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE_URL}/blog/posts`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const postSlug = listBody.data[0].slug;
      const response = await request.get(`${API_BASE_URL}/blog/posts/${postSlug}`);
      
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });

  test('GET /api/blog/posts/:slug - should return 404 for non-existent post', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/posts/non-existent-post`);
    
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/blog/posts - should create post with admin token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/posts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'New Test Post',
        slug: `new-test-post-${Date.now()}`,
        content: 'Content of the new test post.',
        is_published: true
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  test('POST /api/blog/posts - should reject without auth', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/posts`, {
      data: {
        title: 'Unauthorized Post',
        slug: 'unauthorized-post',
        content: 'This should fail.'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/blog/posts - should reject regular user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/posts`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: {
        title: 'User Post',
        slug: 'user-post',
        content: 'User should not be able to create posts.'
      }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PUT /api/blog/posts/:id - should update post with admin token', async ({ request }) => {
    // Create a post first
    const createResponse = await request.post(`${API_BASE_URL}/blog/posts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Post to Update',
        slug: `post-to-update-${Date.now()}`,
        content: 'Original content.'
      }
    });
    const createBody = await createResponse.json();
    const postId = createBody.data.id;

    // Update it
    const response = await request.put(`${API_BASE_URL}/blog/posts/${postId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Updated Post Title'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/blog/posts/:id - should delete post with admin token', async ({ request }) => {
    // Create a post first
    const createResponse = await request.post(`${API_BASE_URL}/blog/posts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Post to Delete',
        slug: `post-to-delete-${Date.now()}`,
        content: 'This will be deleted.'
      }
    });
    const createBody = await createResponse.json();
    const postId = createBody.data.id;

    // Delete it
    const response = await request.delete(`${API_BASE_URL}/blog/posts/${postId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/blog/posts/:id/like - should like a post', async ({ request }) => {
    // Get a post
    const listResponse = await request.get(`${API_BASE_URL}/blog/posts`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const postId = listBody.data[0].id;
      
      const response = await request.post(`${API_BASE_URL}/blog/posts/${postId}/like`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('GET /api/blog/categories - should return blog categories', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/blog/categories`);
    
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test('POST /api/blog/categories - should create category with admin token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'Test category description'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('PUT /api/blog/categories/:id - should update category', async ({ request }) => {
    // Create a category first
    const createResponse = await request.post(`${API_BASE_URL}/blog/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Category to Update',
        slug: `category-to-update-${Date.now()}`
      }
    });
    const createBody = await createResponse.json();
    const categoryId = createBody.data.id;

    // Update it
    const response = await request.put(`${API_BASE_URL}/blog/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Updated Category Name'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/blog/categories/:id - should delete category', async ({ request }) => {
    // Create a category first
    const createResponse = await request.post(`${API_BASE_URL}/blog/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Category to Delete',
        slug: `category-to-delete-${Date.now()}`
      }
    });
    const createBody = await createResponse.json();
    const categoryId = createBody.data.id;

    // Delete it
    const response = await request.delete(`${API_BASE_URL}/blog/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/blog/subscribe - should subscribe to newsletter', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/subscribe`, {
      data: {
        email: `subscriber-${Date.now()}@example.com`,
        name: 'Test Subscriber'
      }
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/blog/subscribe - should reject invalid email', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blog/subscribe`, {
      data: {
        email: 'invalid-email'
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/blog/posts/:id/comments - should return comments for post', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE_URL}/blog/posts`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const postId = listBody.data[0].id;
      
      const response = await request.get(`${API_BASE_URL}/blog/posts/${postId}/comments`);

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST /api/blog/posts/:id/comments - should add comment to post', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE_URL}/blog/posts`);
    const listBody = await listResponse.json();
    
    if (listBody.data.length > 0) {
      const postId = listBody.data[0].id;
      
      const response = await request.post(`${API_BASE_URL}/blog/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${userToken}` },
        data: {
          content: 'This is a test blog comment.'
        }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });
});
