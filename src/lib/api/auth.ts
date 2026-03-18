import { fetchApi, setAuthToken } from './client';
import { User, Profile, ApiResponse } from './types';

export const authApi = {
    async register(email: string, password: string, full_name?: string, username?: string) {
        const response = await fetchApi<{ user: User; token: string; expiresIn: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name, username }),
        });

        if (response.success && response.data) {
            setAuthToken(response.data.token);
        }

        return response;
    },

    async login(email: string, password: string) {
        const response = await fetchApi<{ user: User; token: string; expiresIn: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data) {
            setAuthToken(response.data.token);
        }

        return response;
    },

    async logout() {
        setAuthToken(null);
        return { success: true } as ApiResponse<void>;
    },

    async getCurrentUser() {
        return fetchApi<User>('/auth/me');
    },

    async updateProfile(data: Partial<Profile>) {
        return fetchApi<User>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async changePassword(current_password: string, new_password: string) {
        return fetchApi('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ current_password, new_password }),
        });
    },
};
