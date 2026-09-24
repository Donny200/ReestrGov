import { localizedText } from './translations';
import type { AdminFunction } from '../types/adminFunctions';

export function functionText(record: AdminFunction, field: 'name' | 'description', language: string): string {
  // Original-language mirrors from older seeds must never hide newer original text.
  if (language === record.sourceLanguage) return record[field] ?? '';
  return localizedText(record[field], record[field === 'name' ? 'nameTranslations' : 'descriptionTranslations'], language) ?? '';
}
export function hasFunctionTranslation(record: AdminFunction, language: string): boolean {
  return language === record.sourceLanguage || Boolean(record.nameTranslations?.[language]?.text?.trim() &&
    (!record.description || record.descriptionTranslations?.[language]?.text?.trim()));
}
