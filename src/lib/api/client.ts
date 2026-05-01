import { ApiResponse, ApiError } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 2;

export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

class NetworkError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'NetworkError';
    }
}

class TimeoutError extends Error {
    constructor(url: string) {
        super(`Request timed out: ${url}`);
        this.name = 'TimeoutError';
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

class NotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
    }
}

class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const apiErrors = {
    NetworkError,
    TimeoutError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
};

const timeoutPromise = (ms: number, promise: Promise<Response>): Promise<Response> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new TimeoutError('')), ms);
        promise.then(resolve, reject).finally(() => clearTimeout(timer));
    });
};

const logRequest = (method: string, url: string, body?: unknown) => {
    if (import.meta.env.DEV) {
        console.debug(`[API] ${method} ${url}`, body ? { body } : '');
    }
};

const logResponse = (method: string, url: string, status: number, duration: number) => {
    if (import.meta.env.DEV) {
        const statusColor = status >= 400 ? 'color: #ef4444' : status >= 300 ? 'color: #f59e0b' : 'color: #22c55e';
        console.debug(`[API] ${method} ${url} %c${status}%c ${duration}ms`, statusColor, 'color: #94a3b8');
    }
};

async function requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    attempt = 0
): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const method = options.method || 'GET';
    const url = `${API_BASE_URL}${endpoint}`;

    logRequest(method, url, options.body);

    try {
        const response = await timeoutPromise(
            REQUEST_TIMEOUT,
            fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                credentials: 'include',
            })
        );

        const duration = Date.now() - startTime;
        logResponse(method, url, response.status, duration);

        if (response.status === 204) {
            return { success: true } as ApiResponse<T>;
        }

        const data = await response.json();

        if (response.status === 401) {
            return { success: false, error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' };
        }

        if (response.status === 403) {
            return { success: false, error: 'Bu işlem için yetkiniz yok.' };
        }

        if (response.status === 404) {
            return { success: false, error: 'Kaynak bulunamadı.' };
        }

        if (response.status === 422) {
            return { success: false, error: data.error || data.details || 'Doğrulama hatası.' };
        }

        if (!response.ok) {
            const errorMsg = data.error || `HTTP ${response.status}`;
            if (!response.ok && attempt < MAX_RETRIES - 1) {
                console.warn(`[API] Retry ${attempt + 1}/${MAX_RETRIES}: ${method} ${url}`);
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                return requestWithRetry(endpoint, options, attempt + 1);
            }
            return { success: false, error: errorMsg };
        }

        return data;
    } catch (error) {
        const duration = Date.now() - startTime;
        logResponse(method, url, 0, duration);

        if (error instanceof TimeoutError) {
            return { success: false, error: 'İstek zaman aşımına uğradı. Bağlantınızı kontrol edin.' };
        }

        if (error instanceof TypeError) {
            return { success: false, error: 'Ağ bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.' };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu.',
        };
    }
}

const fetchApi = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    return requestWithRetry<T>(endpoint, options);
};

export { fetchApi };
