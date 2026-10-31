import { ApiResponse } from '../types';

function buildUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let rawApiUrl = ((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string).trim();
  
  if (!rawApiUrl && typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    // If deployed on Vercel and VITE_API_URL was not set in env vars, default to the live backend service
    rawApiUrl = 'https://smart-patient-backend.onrender.com';
  }
  
  if (rawApiUrl) {
    // Strip trailing slashes and any trailing /api to prevent duplication
    const base = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    if (cleanEndpoint.startsWith('/api/')) {
      return `${base}${cleanEndpoint}`;
    }
    return `${base}/api${cleanEndpoint}`;
  }
  
  // Local development / same-origin proxy
  if (cleanEndpoint.startsWith('/api/')) {
    return cleanEndpoint;
  }
  return `/api${cleanEndpoint}`;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('smart_patient_token');
}

export function setToken(token: string): void {
  localStorage.setItem('smart_patient_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('smart_patient_token');
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = buildUrl(endpoint);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to the backend server. The service may be starting up, sleeping, or unreachable.',
      0,
      err
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  // Handle binary download responses
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('image/') || contentType.includes('application/octet-stream'))) {
    if (!response.ok) {
      throw new ApiError('Failed to download file', response.status);
    }
    const blob = await response.blob();
    return blob as unknown as T;
  }

  // Detect HTML response when JSON was expected (e.g. Vercel SPA rewrite fallback when backend is unreachable)
  if (contentType && contentType.includes('text/html') && !endpoint.endsWith('.html')) {
    throw new ApiError(
      'The backend API is unreachable or returned HTML instead of JSON. In production on Vercel, please set VITE_API_URL in your Vercel Project Settings to point to your live backend server.',
      502
    );
  }

  let body: any;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }

  if (!response.ok) {
    let errorMsg = body?.message;
    if (!errorMsg) {
      if (response.status === 405) {
        errorMsg = 'Backend API is not connected or method not allowed (HTTP 405). If running in production, please configure VITE_API_URL in your Vercel project environment variables.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }
    throw new ApiError(errorMsg, response.status, body);
  }

  const apiResponse = body as ApiResponse<T>;
  return apiResponse.data !== undefined ? apiResponse.data : (body as T);
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export const apiClient = api;

