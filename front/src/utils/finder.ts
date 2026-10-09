import type { CatalogFunction } from '../types/api';
import { INSTRUCTION_FIELDS, localizedInstruction } from './instructions';
import { localizedText } from './translations';

const MIN_TERM_LENGTH = 2;

export function searchTerms(query: string, locale: string): string[] {
  return query
    .toLocaleLowerCase(locale)
    .split(/[\s,.;:!?()"'«»]+/)
    .filter((term) => term.length >= MIN_TERM_LENGTH);
}

export function serviceHaystack(record: CatalogFunction, locale: string, extra: (string | null | undefined)[] = []): string {
  const values = [
    record.name,
    localizedText(record.name, record.nameTranslations, locale),
    record.description,
    localizedText(record.description, record.descriptionTranslations, locale),
    record.requirements,
    record.category,
    ...INSTRUCTION_FIELDS.flatMap((field) => [record.instructions?.[field.key], localizedInstruction(record, field.key, locale)?.text]),
    ...extra,
  ];
  return values.filter(Boolean).join(' ').toLocaleLowerCase(locale);
}

export function matchesTerms(haystack: string, terms: string[]): boolean {
  return terms.every((term) => haystack.includes(term));
}
