import { supabase } from './supabase';

/**
 * API Base URL - defaults to localhost in development
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the current user's access token for API authentication.
 */
async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Make an authenticated API request.
 */
async function fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = await getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
}

/**
 * Parse API response and handle errors.
 */
async function parseResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
        const message = data.message || data.error || 'An error occurred';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return data as T;
}

/**
 * API client for making authenticated requests to the backend.
 */
export const api = {
    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetchWithAuth(endpoint, { method: 'GET' });
        return parseResponse<T>(response);
    },

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        const response = await fetchWithAuth(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
        return parseResponse<T>(response);
    },

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        const response = await fetchWithAuth(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
        return parseResponse<T>(response);
    },

    /**
     * DELETE request
     */
    async delete<T = void>(endpoint: string): Promise<T> {
        const response = await fetchWithAuth(endpoint, { method: 'DELETE' });
        return parseResponse<T>(response);
    },

    /**
     * Upload a file (multipart/form-data)
     */
    async uploadFile(endpoint: string, file: File, fieldName: string = 'file'): Promise<{ url: string; path: string }> {
        const token = await getAccessToken();

        const formData = new FormData();
        formData.append(fieldName, file);

        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Don't set Content-Type - browser will set it with boundary for multipart

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return parseResponse<{ url: string; path: string }>(response);
    },
};

/**
 * Helper to build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const filtered = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
}
