import { fetchApi } from './client';
import { BlogPost, BlogCategory, ApiResponse } from './types';

export const blogApi = {
    async getAll(params: any = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });

        return fetchApi<BlogPost[]>(`/blog/posts?${searchParams.toString()}`);
    },

    async getPosts(params: any = {}) {
        return this.getAll(params);
    },

    async getPostBySlug(slug: string) {
        return fetchApi<BlogPost>(`/blog/posts/${slug}`);
    },

    async createPost(data: Partial<BlogPost>) {
        return fetchApi<BlogPost>('/blog/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updatePost(id: string, data: Partial<BlogPost>) {
        return fetchApi<BlogPost>(`/blog/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deletePost(id: string) {
        return fetchApi(`/blog/posts/${id}`, {
            method: 'DELETE',
        });
    },

    async likePost(id: string) {
        return fetchApi<{ liked: boolean }>(`/blog/posts/${id}/like`, {
            method: 'POST',
        });
    },

    async getCategories() {
        return fetchApi<BlogCategory[]>('/blog/categories');
    },

    async createCategory(data: Partial<BlogCategory>) {
        return fetchApi<BlogCategory>('/blog/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCategory(id: string, data: Partial<BlogCategory>) {
        return fetchApi<BlogCategory>(`/blog/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteCategory(id: string) {
        return fetchApi(`/blog/categories/${id}`, {
            method: 'DELETE',
        });
    },

    async getComments(postId: string) {
        return fetchApi(`/blog/posts/${postId}/comments`);
    },

    async addComment(postId: string, content: string, parent_id?: string) {
        return fetchApi(`/blog/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parent_id }),
        });
    },

    async subscribe(email: string, name?: string) {
        return fetchApi('/blog/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email, name }),
        });
    },

    async verifySubscription(token: string) {
        return fetchApi('/blog/verify-subscription', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    },

    async unsubscribe(email: string) {
        return fetchApi('/blog/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async getTags() {
        return fetchApi<{ name: string; count: number }[]>('/blog/tags');
    },
};
