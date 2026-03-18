import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('E2E User Flows', () => {
  test.describe('User Registration and Login Flow', () => {
    const uniqueEmail = `e2e-test-${Date.now()}@example.com`;
    let authToken: string;

    test('should complete full registration flow', async ({ request }) => {
      // 1. Register a new user
      const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
        data: {
          email: uniqueEmail,
          password: 'testpassword123',
          full_name: 'E2E Test User'
        }
      });

      expect(registerResponse.ok()).toBe(true);
      const registerBody = await registerResponse.json();
      expect(registerBody.success).toBe(true);
      expect(registerBody.data).toHaveProperty('token');
      
      authToken = registerBody.data.token;

      // 2. Verify user can get their profile
      const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(meResponse.ok()).toBe(true);
      const meBody = await meResponse.json();
      expect(meBody.data.email).toBe(uniqueEmail);

      // 3. Update profile
      const updateResponse = await request.put(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          full_name: 'Updated Name',
          bio: 'This is my bio'
        }
      });

      expect(updateResponse.ok()).toBe(true);

      // 4. Logout
      const logoutResponse = await request.post(`${API_BASE_URL}/auth/logout`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(logoutResponse.ok()).toBe(true);

      // 5. Login again
      const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: uniqueEmail,
          password: 'testpassword123'
        }
      });

      expect(loginResponse.ok()).toBe(true);
      const loginBody = await loginResponse.json();
      expect(loginBody.data.token).toBeDefined();
    });

    test('should handle invalid login credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Dream Browsing Flow', () => {
    test('should browse dreams and view details', async ({ request }) => {
      // 1. Get list of dreams
      const dreamsResponse = await request.get(`${API_BASE_URL}/dreams`);
      expect(dreamsResponse.ok()).toBe(true);
      const dreamsBody = await dreamsResponse.json();
      expect(dreamsBody.success).toBe(true);

      // 2. Get featured dreams
      const featuredResponse = await request.get(`${API_BASE_URL}/dreams/featured`);
      expect(featuredResponse.ok()).toBe(true);

      // 3. If there are dreams, view one
      if (dreamsBody.data && dreamsBody.data.length > 0) {
        const dreamSlug = dreamsBody.data[0].slug;
        
        const dreamResponse = await request.get(`${API_BASE_URL}/dreams/${dreamSlug}`);
        expect(dreamResponse.ok()).toBe(true);
        const dreamBody = await dreamResponse.json();
        expect(dreamBody.success).toBe(true);
        expect(dreamBody.data).toHaveProperty('title');

        // 4. Get similar dreams
        const similarResponse = await request.get(`${API_BASE_URL}/dreams/${dreamSlug}/similar`);
        expect(similarResponse.ok()).toBe(true);
      }
    });

    test('should search dreams', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/dreams?search=rüya`);
      
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Blog Browsing Flow', () => {
    test('should browse blog posts', async ({ request }) => {
      // 1. Get list of blog posts
      const postsResponse = await request.get(`${API_BASE_URL}/blog/posts`);
      expect(postsResponse.ok()).toBe(true);
      const postsBody = await postsResponse.json();
      expect(postsBody.success).toBe(true);

      // 2. Get blog categories
      const categoriesResponse = await request.get(`${API_BASE_URL}/blog/categories`);
      expect(categoriesResponse.ok()).toBe(true);

      // 3. If there are posts, view one
      if (postsBody.data && postsBody.data.length > 0) {
        const postSlug = postsBody.data[0].slug;
        
        const postResponse = await request.get(`${API_BASE_URL}/blog/posts/${postSlug}`);
        expect(postResponse.ok()).toBe(true);
        const postBody = await postResponse.json();
        expect(postBody.success).toBe(true);
      }
    });

    test('should subscribe to newsletter', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/blog/subscribe`, {
        data: {
          email: `subscriber-${Date.now()}@example.com`,
          name: 'Newsletter Subscriber'
        }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Search Flow', () => {
    test('should perform search', async ({ request }) => {
      // 1. Search for content
      const searchResponse = await request.get(`${API_BASE_URL}/search?q=rüya`);
      expect(searchResponse.ok()).toBe(true);
      const searchBody = await searchResponse.json();
      expect(searchBody.success).toBe(true);

      // 2. Get search suggestions
      const suggestionsResponse = await request.get(`${API_BASE_URL}/search/suggestions?q=r`);
      expect(suggestionsResponse.ok()).toBe(true);
    });

    test('should handle search with filters', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/search?q=test&type=dreams&limit=5`);
      
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Contact Flow', () => {
    test('should submit contact form', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/contact`, {
        data: {
          name: 'Contact Test User',
          email: 'contacttest@example.com',
          subject: 'Test Subject',
          message: 'This is a test contact form submission.'
        }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Category Browsing Flow', () => {
    test('should browse and filter by categories', async ({ request }) => {
      // 1. Get all categories
      const categoriesResponse = await request.get(`${API_BASE_URL}/categories`);
      expect(categoriesResponse.ok()).toBe(true);
      const categoriesBody = await categoriesResponse.json();
      expect(categoriesBody.success).toBe(true);

      // 2. If there are categories, filter dreams by category
      if (categoriesBody.data && categoriesBody.data.length > 0) {
        const categoryId = categoriesBody.data[0].id;
        
        const dreamsResponse = await request.get(
          `${API_BASE_URL}/dreams?category_id=${categoryId}`
        );
        expect(dreamsResponse.ok()).toBe(true);
      }
    });
  });

  test.describe('Pagination Flow', () => {
    test('should handle pagination correctly', async ({ request }) => {
      // 1. Get first page
      const page1Response = await request.get(`${API_BASE_URL}/dreams?page=1&limit=2`);
      expect(page1Response.ok()).toBe(true);
      const page1Body = await page1Response.json();
      
      const page1Items = page1Body.data;

      // 2. Get second page
      const page2Response = await request.get(`${API_BASE_URL}/dreams?page=2&limit=2`);
      expect(page2Response.ok()).toBe(true);
      const page2Body = await page2Response.json();
      
      const page2Items = page2Body.data;

      // 3. Verify pagination metadata
      expect(page1Body.pagination).toBeDefined();
      expect(page1Body.pagination.page).toBe(1);
      expect(page1Body.pagination.totalPages).toBeGreaterThan(0);
    });
  });
});
