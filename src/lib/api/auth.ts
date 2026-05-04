import { fetchApi } from './client';
import { User, Profile, ApiResponse } from './types';

export const authApi = {
    async register(email: string, password: string, full_name?: string, username?: string) {
        return fetchApi<{ user: User; expiresIn: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name, username }),
        });
    },

    async login(email: string, password: string) {
        return fetchApi<{ user: User; expiresIn: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async adminLogin(email: string, password: string) {
        return fetchApi<{ user: User; expiresIn: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, isAdmin: true }),
        });
    },

    async logout() {
        return fetchApi<void>('/auth/logout', {
            method: 'POST',
        });
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

    async signInWithOAuth(provider: 'google' | 'facebook' | 'github') {
        return fetchApi<{ url: string }>(`/auth/oauth/${provider}`);
    },

    async resetPassword(email: string) {
        return fetchApi<{ success: boolean; message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },
};