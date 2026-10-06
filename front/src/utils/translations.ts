import type { TranslatedText } from '../types/api';

export function localizedText(
  original: string | null | undefined,
  translations: Record<string, TranslatedText> | undefined,
  locale: string
): string | null | undefined {
  const translated = translations?.[locale.toLowerCase()]?.text?.trim();
  return translated || original;
}
