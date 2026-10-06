import { localizedText } from './translations';
import type { AdminFunction } from '../types/adminFunctions';

export function functionText(record: AdminFunction, field: 'name' | 'description', language: string): string {
  if (language === record.sourceLanguage) return record[field] ?? '';
  const translations = field === 'name' ? record.nameTranslations : record.descriptionTranslations;
  return localizedText(record[field], translations, language) ?? '';
}

export function hasFunctionTranslation(record: AdminFunction, language: string): boolean {
  if (language === record.sourceLanguage) return true;
  const name = record.nameTranslations?.[language]?.text?.trim();
  const description = record.descriptionTranslations?.[language]?.text?.trim();
  return Boolean(name && (!record.description || description));
}
