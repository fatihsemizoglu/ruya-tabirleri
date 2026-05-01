import { fetchApi } from './client';
import { Dream, Comment, ApiResponse } from './types';

export const dreamsApi = {
    async getAll(params: any = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });

        return fetchApi<Dream[]>(`/dreams?${searchParams.toString()}`);
    },

    async getFeatured(limit = 5) {
        return fetchApi<Dream[]>(`/dreams/featured?limit=${limit}`);
    },

    async getBySlug(slug: string) {
        return fetchApi<Dream>(`/dreams/${slug}`);
    },

    async create(data: Partial<Dream>) {
        return fetchApi<Dream>('/dreams', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Dream>) {
        return fetchApi<Dream>(`/dreams/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi(`/dreams/${id}`, {
            method: 'DELETE',
        });
    },

    async like(id: string) {
        return fetchApi(`/dreams/${id}/like`, {
            method: 'POST',
        });
    },

    async favorite(id: string) {
        return fetchApi(`/dreams/${id}/favorite`, {
            method: 'POST',
        });
    },

    async getComments(id: string) {
        return fetchApi<Comment[]>(`/dreams/${id}/comments`);
    },

    async addComment(id: string, content: string) {
        return fetchApi<Comment>(`/dreams/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    async getSimilar(id: string) {
        return fetchApi<Dream[]>(`/dreams/${id}/similar`);
    },
};
