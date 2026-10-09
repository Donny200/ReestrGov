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

export function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
    skipRefresh?: boolean;
    skipUnauthorizedHandler?: boolean;
  signal?: AbortSignal;
}

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

export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    }).
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

export interface DownloadResult {
  filename: string;
  truncated: boolean;
}

function filenameOf(header: string | null): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : null;
}

export async function apiDownload(path: string, query?: RequestOptions['query']): Promise<DownloadResult> {
  const execute = () => fetch(buildUrl(path, query), { credentials: 'include' });
  let response: Response;
  try {
    response = await execute();
  } catch {
    throw new ApiError(0, 'Network error');
  }
  if (response.status === 401) {
    if (await refreshSession()) {
      response = await execute();
    } else {
      unauthorizedHandler?.();
      throw new ApiError(401, 'Session expired');
    }
  }
  if (!response.ok) {
    const payload = await parseBody(response);
    throw new ApiError(response.status, messageFor(response.status, payload), extractFieldErrors(payload), payload);
  }
  const blob = await response.blob();
  const filename = filenameOf(response.headers.get('Content-Disposition')) ?? 'export.csv';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename, truncated: response.headers.get('X-Export-Truncated') === 'true' };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, skipRefresh, skipUnauthorizedHandler, signal } = options;

  const execute = (): Promise<Response> =>
  fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  });

  let response: Response;
  try {
    response = await execute();
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'Network error');
  }

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await execute();
    } else {
      if (!skipUnauthorizedHandler) unauthorizedHandler?.();
      throw new ApiError(401, 'Session expired');
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) unauthorizedHandler?.();
    throw new ApiError(response.status, messageFor(response.status, payload), extractFieldErrors(payload), payload);
  }

  return payload as T;
}
