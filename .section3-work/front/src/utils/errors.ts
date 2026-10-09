import { ApiError, type FieldIssue } from '../services/http';

/** Human-friendly (Uzbek) message for any thrown error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || 'Kiritilgan ma’lumotlarda xatolik bor';
      case 401:
        return 'Sessiya muddati tugadi — qaytadan kiring';
      case 403:
        return 'Sizda ushbu amal uchun ruxsat yo‘q';
      case 404:
        return error.message || 'Ma’lumot topilmadi';
      case 409:
        return error.message || 'Amalni bajarish mumkin emas — ziddiyat aniqlandi';
      case 0:
        return 'Serverga ulanib bo‘lmadi';
      default:
        return error.message || 'Kutilmagan xatolik yuz berdi';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Kutilmagan xatolik yuz berdi';
}

export function statusOf(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null;
}

export function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return error.fieldErrors.reduce<Record<string, string>>((acc, issue: FieldIssue) => {
    acc[issue.field] = issue.message;
    return acc;
  }, {});
}