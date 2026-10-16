/**
 * A non-secret hint that this browser has used support, so the unread badge only polls where a thread can exist.
 * The guest secret itself lives in an HttpOnly cookie that JavaScript cannot read.
 */
const ACTIVE_KEY = 'reestr-support-active';
const NOTIFIED_KEY = 'reestr-support-notified-reply';

export function supportActive(): boolean {
  try {
    return window.localStorage.getItem(ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSupportActive(): void {
  try {
    window.localStorage.setItem(ACTIVE_KEY, '1');
  } catch {
    // Storage blocked: the badge then works only while signed in or on the support page.
  }
}

export function forgetSupportActive(): void {
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
    window.localStorage.removeItem(NOTIFIED_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Highest reply id the visitor was already told about (so a reply is announced once). */
export function lastNotifiedReply(): number {
  try {
    return Number(window.localStorage.getItem(NOTIFIED_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

export function rememberNotifiedReply(id: number): void {
  try {
    window.localStorage.setItem(NOTIFIED_KEY, String(id));
  } catch {
    // Storage blocked: the reply may be announced again after a reload.
  }
}

/** Idempotency key for one message; retries reuse it so the server stores the message once. */
export function newClientMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
