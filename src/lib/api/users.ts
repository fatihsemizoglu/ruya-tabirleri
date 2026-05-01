import { fetchApi } from './client';
import { Favorite, ViewHistory, DreamJournalEntry } from './types';

export const usersApi = {
    async getFavorites(page = 1, limit = 20) {
        return fetchApi<Favorite[]>(`/users/favorites?page=${page}&limit=${limit}`);
    },

    async addFavorite(dreamId: string) {
        return fetchApi('/users/favorites', {
            method: 'POST',
            body: JSON.stringify({ dream_id: dreamId }),
        });
    },

    async removeFavorite(id: string) {
        return fetchApi(`/users/favorites/${id}`, {
            method: 'DELETE',
        });
    },

    async getHistory(page = 1, limit = 20) {
        return fetchApi<ViewHistory[]>(`/users/history?page=${page}&limit=${limit}`);
    },

    async clearHistory() {
        return fetchApi('/users/history', {
            method: 'DELETE',
        });
    },

    async removeFromHistory(dreamId: string) {
        return fetchApi(`/users/history/${dreamId}`, {
            method: 'DELETE',
        });
    },

    async removeHistoryItem(id: string) {
        return fetchApi(`/users/history/${id}`, {
            method: 'DELETE',
        });
    },

    async getJournal(page = 1, limit = 20) {
        return fetchApi<DreamJournalEntry[]>(`/users/journal?page=${page}&limit=${limit}`);
    },

    async createJournalEntry(data: Partial<DreamJournalEntry>) {
        return fetchApi<DreamJournalEntry>('/users/journal', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateJournalEntry(id: string, data: Partial<DreamJournalEntry>) {
        return fetchApi<DreamJournalEntry>(`/users/journal/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteJournalEntry(id: string) {
        return fetchApi(`/users/journal/${id}`, {
            method: 'DELETE',
        });
    },

    async getLikes() {
        return fetchApi('/users/likes');
    },

    async getStats() {
        return fetchApi<{
            totalFavorites: number;
            totalViews: number;
            totalComments: number;
            totalLikes: number;
            journalEntries: number;
            moodDistribution: Record<string, number>;
            recentActivity: { type: string; title: string; date: string; link?: string }[];
        }>('/users/stats');
    },
};
