import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getInterfaceTranslations, getLanguages } from '../services/referenceService';

export interface InterfaceLanguage {
  code: string;
  label: string;
}

interface I18nValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  available: InterfaceLanguage[];
  reloadLanguages: () => Promise<void>;
}

const I18nContext = createContext<I18nValue | null>(null);
const DEFAULT_LOCALE = 'uz';
const STORAGE_KEY = 'reestr-task-locale';

function initialLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE;
}

export function I18nProvider({ children }: {children: React.ReactNode;}) {
  const [locale, setLocaleState] = useState<string>(initialLocale);
  const [available, setAvailable] = useState<InterfaceLanguage[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const setLocale = useCallback((nextLocale: string) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  const reloadLanguages = useCallback(async () => {
    try {
      const languages = await getLanguages();
      const nextAvailable = languages.map((language) => ({
        code: language.code,
        label: language.nativeName || language.name
      }));

      if (nextAvailable.length === 0) return;
      setAvailable(nextAvailable);
      setLocaleState((current) => {
        if (nextAvailable.some((language) => language.code === current)) return current;
        const fallback = nextAvailable.find((language) => language.code === DEFAULT_LOCALE) ?? nextAvailable[0];
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, fallback.code);
        return fallback.code;
      });
    } catch {
      // Language choices and interface text are owned by the reference service.
      setAvailable([]);
    }
  }, []);

  useEffect(() => {
    void reloadLanguages();
  }, [reloadLanguages]);

  useEffect(() => {
    let cancelled = false;
    setTranslations({});

    getInterfaceTranslations(locale)
      .then((dictionary) => {
        if (!cancelled) setTranslations(dictionary);
      })
      .catch(() => {
        if (!cancelled) setTranslations({});
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useCallback(
    (key: string): string => {
      return translations[key] || key;
    },
    [translations]
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t, available, reloadLanguages }),
    [locale, setLocale, t, available, reloadLanguages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
