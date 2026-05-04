import { fetchApi } from './client';
import { Comment, User, Profile } from './types';

export const adminApi = {
    // Comments management
    async getComments(filters?: { status?: 'pending' | 'approved' | 'all'; limit?: number }) {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters?.limit) {
            params.append('limit', String(filters.limit));
        }
        return fetchApi<Comment[]>(`/admin/comments?${params.toString()}`);
    },

    async approveComment(id: string) {
        return fetchApi<Comment>(`/admin/comments/${id}/approve`, {
            method: 'PUT',
        });
    },

    async rejectComment(id: string) {
        return fetchApi<Comment>(`/admin/comments/${id}/reject`, {
            method: 'PUT',
        });
    },

    async deleteComment(id: string) {
        return fetchApi(`/admin/comments/${id}`, {
            method: 'DELETE',
        });
    },

    // Contact messages management
    async getContactMessages(params?: { page?: number; limit?: number; is_read?: boolean }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', String(params.page));
        if (params?.limit) searchParams.append('limit', String(params.limit));
        if (params?.is_read !== undefined) searchParams.append('is_read', String(params.is_read));
        return fetchApi<{ messages: any[]; total: number }>(`/admin/contact-messages?${searchParams.toString()}`);
    },

    async markMessageAsRead(id: string) {
        return fetchApi(`/admin/contact-messages/${id}/read`, {
            method: 'PUT',
        });
    },

    async deleteMessage(id: string) {
        return fetchApi(`/admin/contact-messages/${id}`, {
            method: 'DELETE',
        });
    },

    // Statistics
    async getStatistics() {
        return fetchApi<{
            totalDreams: number;
            totalCategories: number;
            totalUsers: number;
            totalViews: number;
            totalLikes: number;
            totalComments: number;
            featuredDreams: number;
            avgViewsPerDream: number;
            dreams: any[];
            categories: any[];
        }>('/admin/statistics');
    },

    async getCategoryStats() {
        return fetchApi<{ name: string; dreamCount: number }[]>('/admin/category-stats');
    },

    async getTopDreams(limit = 10) {
        return fetchApi<{ id: string; title: string; view_count: number; like_count: number }[]>(`/admin/top-dreams?limit=${limit}`);
    },

    // Audit logs
    async getAuditLogs(params?: {
        page?: number;
        limit?: number;
        entity_type?: string;
        action?: string;
        search?: string;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', String(params.page));
        if (params?.limit) searchParams.append('limit', String(params.limit));
        if (params?.entity_type && params.entity_type !== 'all') searchParams.append('entity_type', params.entity_type);
        if (params?.action && params.action !== 'all') searchParams.append('action', params.action);
        if (params?.search) searchParams.append('search', params.search);
        return fetchApi<{ logs: any[]; total: number }>(`/admin/audit-logs?${searchParams.toString()}`);
    },

    // Users management
    async getAllUsers(page = 1, limit = 20) {
        return fetchApi<User[]>(`/admin/users?page=${page}&limit=${limit}`);
    },

    async deleteUser(id: string) {
        return fetchApi(`/admin/users/${id}`, {
            method: 'DELETE',
        });
    },

    async getProfiles(userIds: string[]) {
        return fetchApi<Profile[]>(`/admin/profiles?ids=${userIds.join(',')}`);
    },

    // Notifications management
    async getNotifications(params?: { page?: number; limit?: number; is_active?: boolean }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', String(params.page));
        if (params?.limit) searchParams.append('limit', String(params.limit));
        if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
        return fetchApi<any[]>(`/admin/notifications?${searchParams.toString()}`);
    },

    async getActiveNotifications() {
        return fetchApi<any[]>('/admin/notifications/active');
    },

    async createNotification(data: any) {
        return fetchApi<any>('/admin/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateNotification(id: string, data: any) {
        return fetchApi<any>(`/admin/notifications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteNotification(id: string) {
        return fetchApi(`/admin/notifications/${id}`, {
            method: 'DELETE',
        });
    },

    async toggleNotification(id: string) {
        return fetchApi<{ is_active: boolean }>(`/admin/notifications/${id}/toggle`, {
            method: 'POST',
        });
    },

    async markNotificationRead(id: string) {
        return fetchApi(`/admin/notifications/${id}/read`, {
            method: 'POST',
        });
    },
};
