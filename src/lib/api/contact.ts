import { fetchApi } from './client';

export const contactApi = {
    async send(name: string, email: string, subject: string, message: string) {
        return fetchApi('/contact', {
            method: 'POST',
            body: JSON.stringify({ name, email, subject, message }),
        });
    },

    async getAll(page = 1, limit = 20, is_read?: boolean) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (is_read !== undefined) {
            params.append('is_read', String(is_read));
        }
        return fetchApi(`/contact?${params.toString()}`);
    },

    async markAsRead(id: string) {
        return fetchApi(`/contact/${id}/read`, {
            method: 'PUT',
        });
    },

    async delete(id: string) {
        return fetchApi(`/contact/${id}`, {
            method: 'DELETE',
        });
    },
};
