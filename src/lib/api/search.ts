import { fetchApi } from './client';
import { Dream } from './types';

export const searchApi = {
    async search(query: string, page = 1, limit = 20) {
        return fetchApi<Dream[]>(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },

    async getSuggestions(query: string, limit = 10) {
        return fetchApi<{ title: string; slug: string }[]>(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    },

    async getPopular(limit = 10) {
        return fetchApi<{ query: string; count: number }[]>(`/search/popular?limit=${limit}`);
    },
};
