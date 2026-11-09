import type { ZodSchema } from 'zod';
import { logger } from './logger';

export type ApiResponse<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; code?: string; status: number; retryAfter?: number };

export interface ApiClientOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  body?: unknown;
  schema?: ZodSchema<T>;
  timeoutMs?: number;
  skipAuthRedirect?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorPayload {
  message?: string;
  code?: string;
}

interface ApiResponseEnvelope {
  success?: boolean;
  data?: unknown;
  error?: string | ApiErrorPayload;
  message?: string;
  code?: string;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions<T> = {}
): Promise<ApiResponse<T>> {
  const {
    body,
    schema,
    timeoutMs = 15000,
    skipAuthRedirect = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(customHeaders);
  if (body !== undefined && !headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const serializedBody =
    body !== undefined
      ? body instanceof FormData
        ? body
        : typeof body === 'string'
        ? body
        : JSON.stringify(body)
      : undefined;

  try {
    const res = await fetch(endpoint, {
      ...fetchOptions,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 401 Unauthorized handling
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !skipAuthRedirect) {
        const currentPath = encodeURIComponent(window.location.pathname);
        const loginUrl = new URL(`/login?redirect=${currentPath}`, window.location.origin);
        window.location.assign(loginUrl.toString());
      }
      return {
        ok: false,
        error: 'Authentication required. Please sign in to continue.',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    // 429 Rate Limit handling
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      return {
        ok: false,
        error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        code: 'RATE_LIMITED',
        status: 429,
        retryAfter,
      };
    }

    // Parse JSON envelope { success, data, error, code }
    let json: ApiResponseEnvelope | null = null;
    try {
      json = (await res.json()) as ApiResponseEnvelope;
    } catch {
      // Non-JSON response
      if (!res.ok) {
        return {
          ok: false,
          error: `HTTP ${res.status}: Unexpected server response`,
          status: res.status,
        };
      }
      return {
        ok: true,
        data: undefined as unknown as T,
        status: res.status,
      };
    }

    // Check application success flag or HTTP status
    if (!res.ok || json?.success === false) {
      const errorObj = typeof json?.error === 'object' && json?.error !== null ? json.error : null;
      const errorMessage =
        errorObj?.message ||
        (typeof json?.error === 'string' ? json.error : null) ||
        json?.message ||
        `Request failed with status ${res.status}`;
      const errorCode = errorObj?.code || json?.code;

      return {
        ok: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'An unexpected error occurred',
        code: errorCode,
        status: res.status,
      };
    }

    const payload = json?.data !== undefined ? json.data : json;

    // Validate payload against schema if provided
    if (schema) {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        logger.warn(`[ApiClient] Schema validation warning for ${endpoint}:`, parsed.error.issues);
        // Fall back to payload while logging warning to avoid total client crash
      } else {
        return { ok: true, data: parsed.data, status: res.status };
      }
    }

    return { ok: true, data: payload as T, status: res.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        error: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
        code: 'TIMEOUT',
        status: 408,
      };
    }

    return {
      ok: false,
      error: 'Network connectivity error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  }
}
