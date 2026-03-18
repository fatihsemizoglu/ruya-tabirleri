import { ApiResponse } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// Helper function to set auth token
export function setAuthToken(token: string | null): void {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

// Helper function to get headers
function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Generic fetch function for API requests
 */
export async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...getHeaders(),
                ...options.headers,
            },
        });

        // Handle 204 No Content
        if (response.status === 204) {
            return { success: true } as ApiResponse<T>;
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP error: ${response.status}`,
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
