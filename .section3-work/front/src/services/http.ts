import { API_BASE_URL } from '../config/env';

export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldIssue[];
  readonly payload: unknown;

  constructor(status: number, message: string, fieldErrors: FieldIssue[] = [], payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.payload = payload;
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** AuthContext registers a handler so a failed refresh can bounce to /login. */
export function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip the automatic refresh-and-retry (used by the auth endpoints themselves). */
  skipRefresh?: boolean;
  /** Do not redirect to /login when this request is used only to restore a session. */
  skipUnauthorizedHandler?: boolean;
  signal?: AbortSignal;
}

interface CsrfTokenResponse {
  token: string;
  headerName: string;
}

type RequestMethod = NonNullable<RequestOptions['method']>;

const UNSAFE_METHODS = new Set<RequestMethod>(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

let csrfToken: string | null = null;
let csrfInFlight: Promise<string> | null = null;

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const base = API_BASE_URL.replace(/\/$/, '');
  const target = path.startsWith('http') ? path : `${base}${path}`;
  const url = new URL(target, origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function extractFieldErrors(payload: unknown): FieldIssue[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.errors)) {
    return record.errors.
    map((item) => {
      const entry = item as Record<string, unknown>;
      const field = String(entry.field ?? entry.property ?? '');
      const message = String(entry.message ?? entry.defaultMessage ?? '');
      return { field, message };
    }).
    filter((issue) => issue.field && issue.message);
  }

  if (record.fieldErrors && typeof record.fieldErrors === 'object') {
    return Object.entries(record.fieldErrors as Record<string, string>).map(([field, message]) => ({
      field,
      message: String(message)
    }));
  }

  return [];
}

let refreshInFlight: Promise<boolean> | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  if (!csrfInFlight) {
    csrfInFlight = fetch(buildUrl('/api/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }).
    then(async (response) => {
      const payload = await parseBody(response);
      if (!response.ok) {
        throw new ApiError(response.status, messageFor(response.status, payload), [], payload);
      }
      if (!payload || typeof payload !== 'object') {
        throw new ApiError(0, 'CSRF tokenini olib bo\u2018lmadi');
      }

      const result = payload as Partial<CsrfTokenResponse>;
      if (!result.token || result.headerName !== CSRF_HEADER_NAME) {
        throw new ApiError(0, 'CSRF token javobi noto\u2018g\u2018ri');
      }

      csrfToken = result.token;
      return result.token;
    }).
    finally(() => {
      csrfInFlight = null;
    });
  }

  return csrfInFlight;
}

async function requestHeaders(method: RequestMethod, hasBody: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (UNSAFE_METHODS.has(method)) headers[CSRF_HEADER_NAME] = await ensureCsrfToken();
  return headers;
}

/** POST /api/auth/refresh — no body, refreshes the HttpOnly cookies. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = requestHeaders('POST', false).
    then((headers) => fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers
    })).
    then((response) => response.ok).
    catch(() => false).
    finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFor(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const raw = record.message ?? record.error ?? record.detail;
    if (typeof raw === 'string' && raw.trim()) return raw;
  }
  if (typeof payload === 'string' && payload.trim()) return payload;
  return `HTTP ${status}`;
}

/**
 * Single entry point for every backend call.
 * - Always sends cookies (`credentials: "include"`).
 * - Never sends an Authorization header: auth is HttpOnly-cookie based.
 * - On 401 it tries POST /api/auth/refresh exactly once, then gives up.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, skipRefresh, skipUnauthorizedHandler, signal } = options;

  const execute = async (): Promise<Response> => {
    const headers = await requestHeaders(method, body !== undefined);
    return fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  };

  let response: Response;
  try {
    response = await execute();
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Serverga ulanib bo‘lmadi');
  }

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await execute();
    } else {
      if (!skipUnauthorizedHandler) unauthorizedHandler?.();
      throw new ApiError(401, 'Sessiya muddati tugadi');
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) unauthorizedHandler?.();
    throw new ApiError(response.status, messageFor(response.status, payload), extractFieldErrors(payload), payload);
  }

  return payload as T;
}
