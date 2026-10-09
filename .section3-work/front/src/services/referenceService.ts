import type { Language, LanguageSearchResult, Region } from '../types/api';
import { apiRequest } from './http';

/** GET /api/regions */
export function getRegions(): Promise<Region[]> {
  return apiRequest<Region[]>('/api/regions');
}

/** GET /api/regions/{id} */
export function getRegion(id: number): Promise<Region> {
  return apiRequest<Region>(`/api/regions/${id}`);
}

/** GET /api/languages */
export function getLanguages(): Promise<Language[]> {
  return apiRequest<Language[]>('/api/languages');
}

/** GET /api/interface-translations/{languageCode} */
export function getInterfaceTranslations(languageCode: string): Promise<Record<string, string>> {
  return apiRequest<Record<string, string>>(`/api/interface-translations/${encodeURIComponent(languageCode)}`);
}

/** GET /api/languages/search?q={query}; this is available to SUPER_ADMIN only. */
export function searchLanguages(query: string): Promise<LanguageSearchResult[]> {
  return apiRequest<LanguageSearchResult[]>('/api/languages/search', { query: { q: query } });
}

/** POST /api/languages */
export function addLanguage(code: string): Promise<Language> {
  return apiRequest<Language>('/api/languages', { method: 'POST', body: { code } });
}

/** DELETE /api/languages/{id} */
export function deleteLanguage(id: number): Promise<void> {
  return apiRequest<void>(`/api/languages/${id}`, { method: 'DELETE' });
}
