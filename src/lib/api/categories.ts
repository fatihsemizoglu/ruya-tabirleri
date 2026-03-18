import { fetchApi } from './client';
import { Category } from './types';

export const categoriesApi = {
    async getAll() {
        return fetchApi<Category[]>('/categories');
    },

    async getBySlug(slug: string) {
        return fetchApi<Category>(`/categories/${slug}`);
    },

    async create(data: Partial<Category>) {
        return fetchApi<Category>('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Category>) {
        return fetchApi<Category>(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi(`/categories/${id}`, {
            method: 'DELETE',
        });
    },
};
