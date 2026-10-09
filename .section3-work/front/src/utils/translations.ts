import type { TranslatedText } from '../types/api';

/** Uses the original value while a translation is absent or being retried. */
export function localizedText(
  original: string | null | undefined,
  translations: Record<string, TranslatedText> | undefined,
  locale: string
): string | null | undefined {
  const translated = translations?.[locale.toLowerCase()]?.text?.trim();
  return translated || original;
}
