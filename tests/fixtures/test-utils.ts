import { test as base, Page } from '@playwright/test';

export const API_BASE_URL = 'http://localhost:3001/api';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: 'admin' | 'moderator' | 'user';
}

export interface TestDream {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export interface TestBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
}

// Extended test context with API helpers
export const test = base.extend<{
  api: {
    baseURL: string;
    auth: {
      login: (email: string, password: string) => Promise<{ token: string; user: TestUser }>;
      register: (email: string, password: string, fullName?: string) => Promise<{ token: string; user: TestUser }>;
      getMe: (token: string) => Promise<TestUser>;
    };
    dreams: {
      getAll: (params?: Record<string, string>) => Promise<any>;
      getBySlug: (slug: string, token?: string) => Promise<any>;
      getFeatured: () => Promise<any>;
      create: (token: string, data: Partial<TestDream>) => Promise<any>;
      update: (token: string, id: string, data: Partial<TestDream>) => Promise<any>;
      delete: (token: string, id: string) => Promise<any>;
      like: (token: string, id: string) => Promise<any>;
      favorite: (token: string, id: string) => Promise<any>;
      getComments: (id: string) => Promise<any>;
      addComment: (token: string, id: string, content: string) => Promise<any>;
    };
    blog: {
      getPosts: (params?: Record<string, string>) => Promise<any>;
      getPostBySlug: (slug: string) => Promise<any>;
      getCategories: () => Promise<any>;
      createPost: (token: string, data: Partial<TestBlogPost>) => Promise<any>;
      updatePost: (token: string, id: string, data: Partial<TestBlogPost>) => Promise<any>;
      deletePost: (token: string, id: string) => Promise<any>;
      likePost: (token: string, id: string) => Promise<any>;
      subscribe: (email: string) => Promise<any>;
    };
    categories: {
      getAll: () => Promise<any>;
      getById: (id: string) => Promise<any>;
      create: (token: string, data: any) => Promise<any>;
      update: (token: string, id: string, data: any) => Promise<any>;
      delete: (token: string, id: string) => Promise<any>;
    };
    admin: {
      getStatistics: (token: string) => Promise<any>;
      getUsers: (token: string, params?: Record<string, string>) => Promise<any>;
      updateUserRole: (token: string, userId: string, role: string) => Promise<any>;
      deleteUser: (token: string, userId: string) => Promise<any>;
      getComments: (token: string, params?: Record<string, string>) => Promise<any>;
      approveComment: (token: string, commentId: string) => Promise<any>;
      rejectComment: (token: string, commentId: string) => Promise<any>;
      deleteComment: (token: string, commentId: string) => Promise<any>;
      getContactMessages: (token: string) => Promise<any>;
      getAuditLogs: (token: string, params?: Record<string, string>) => Promise<any>;
    };
    search: {
      search: (query: string, params?: Record<string, string>) => Promise<any>;
      getSuggestions: (query: string) => Promise<any>;
    };
  };
}>({
  api: async ({ request }, use) => {
    const baseURL = API_BASE_URL;

    await use({
      baseURL,
      auth: {
        login: async (email: string, password: string) => {
          const response = await request.post(`${baseURL}/auth/login`, {
            data: { email, password }
          });
          const body = await response.json();
          if (!body.success) throw new Error(body.error || 'Login failed');
          return { token: body.data.token, user: body.data.user };
        },
        register: async (email: string, password: string, fullName?: string) => {
          const response = await request.post(`${baseURL}/auth/register`, {
            data: { email, password, full_name: fullName }
          });
          const body = await response.json();
          if (!body.success) throw new Error(body.error || 'Registration failed');
          return { token: body.data.token, user: body.data.user };
        },
        getMe: async (token: string) => {
          const response = await request.get(`${baseURL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const body = await response.json();
          if (!body.success) throw new Error(body.error || 'Get me failed');
          return body.data;
        },
      },
      dreams: {
        getAll: async (params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/dreams`);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString());
          return response.json();
        },
        getBySlug: async (slug: string, token?: string) => {
          const options: { headers?: Record<string, string> } = {};
          if (token) {
            options.headers = { Authorization: `Bearer ${token}` };
          }
          const response = await request.get(`${baseURL}/dreams/${slug}`, options);
          return response.json();
        },
        getFeatured: async () => {
          const response = await request.get(`${baseURL}/dreams/featured`);
          return response.json();
        },
        create: async (token: string, data: Partial<TestDream>) => {
          const response = await request.post(`${baseURL}/dreams`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        update: async (token: string, id: string, data: Partial<TestDream>) => {
          const response = await request.put(`${baseURL}/dreams/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        delete: async (token: string, id: string) => {
          const response = await request.delete(`${baseURL}/dreams/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        like: async (token: string, id: string) => {
          const response = await request.post(`${baseURL}/dreams/${id}/like`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        favorite: async (token: string, id: string) => {
          const response = await request.post(`${baseURL}/dreams/${id}/favorite`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        getComments: async (id: string) => {
          const response = await request.get(`${baseURL}/dreams/${id}/comments`);
          return response.json();
        },
        addComment: async (token: string, id: string, content: string) => {
          const response = await request.post(`${baseURL}/dreams/${id}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { content }
          });
          return response.json();
        },
      },
      blog: {
        getPosts: async (params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/blog/posts`);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString());
          return response.json();
        },
        getPostBySlug: async (slug: string) => {
          const response = await request.get(`${baseURL}/blog/posts/${slug}`);
          return response.json();
        },
        getCategories: async () => {
          const response = await request.get(`${baseURL}/blog/categories`);
          return response.json();
        },
        createPost: async (token: string, data: Partial<TestBlogPost>) => {
          const response = await request.post(`${baseURL}/blog/posts`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        updatePost: async (token: string, id: string, data: Partial<TestBlogPost>) => {
          const response = await request.put(`${baseURL}/blog/posts/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        deletePost: async (token: string, id: string) => {
          const response = await request.delete(`${baseURL}/blog/posts/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        likePost: async (token: string, id: string) => {
          const response = await request.post(`${baseURL}/blog/posts/${id}/like`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        subscribe: async (email: string) => {
          const response = await request.post(`${baseURL}/blog/subscribe`, {
            data: { email }
          });
          return response.json();
        },
      },
      categories: {
        getAll: async () => {
          const response = await request.get(`${baseURL}/categories`);
          return response.json();
        },
        getById: async (id: string) => {
          const response = await request.get(`${baseURL}/categories/${id}`);
          return response.json();
        },
        create: async (token: string, data: any) => {
          const response = await request.post(`${baseURL}/categories`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        update: async (token: string, id: string, data: any) => {
          const response = await request.put(`${baseURL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            data
          });
          return response.json();
        },
        delete: async (token: string, id: string) => {
          const response = await request.delete(`${baseURL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
      },
      admin: {
        getStatistics: async (token: string) => {
          const response = await request.get(`${baseURL}/admin/statistics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        getUsers: async (token: string, params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/admin/users`);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        updateUserRole: async (token: string, userId: string, role: string) => {
          const response = await request.put(`${baseURL}/admin/users/${userId}/role`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { role }
          });
          return response.json();
        },
        deleteUser: async (token: string, userId: string) => {
          const response = await request.delete(`${baseURL}/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        getComments: async (token: string, params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/admin/comments`);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        approveComment: async (token: string, commentId: string) => {
          const response = await request.put(`${baseURL}/admin/comments/${commentId}/approve`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        rejectComment: async (token: string, commentId: string) => {
          const response = await request.put(`${baseURL}/admin/comments/${commentId}/reject`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        deleteComment: async (token: string, commentId: string) => {
          const response = await request.delete(`${baseURL}/admin/comments/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        getContactMessages: async (token: string) => {
          const response = await request.get(`${baseURL}/admin/contact-messages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
        getAuditLogs: async (token: string, params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/admin/audit-logs`);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.json();
        },
      },
      search: {
        search: async (query: string, params?: Record<string, string>) => {
          const url = new URL(`${baseURL}/search`);
          url.searchParams.append('q', query);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
          }
          const response = await request.get(url.toString());
          return response.json();
        },
        getSuggestions: async (query: string) => {
          const url = new URL(`${baseURL}/search/suggestions`);
          url.searchParams.append('q', query);
          const response = await request.get(url.toString());
          return response.json();
        },
      },
    });
  },
});

export { expect } from '@playwright/test';
