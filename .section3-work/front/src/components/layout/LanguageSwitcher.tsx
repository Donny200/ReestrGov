import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, GlobeIcon } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export function LanguageSwitcher({ tone = 'dark' }: {tone?: 'dark' | 'light';}) {
  const { locale, setLocale, available } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = tone === 'light';

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = available.find((item) => item.code === locale);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
        isLight ? 'text-white/90 hover:bg-white/10' : 'text-navy-600 hover:bg-navy-50'}`
        }>
        
        <GlobeIcon className="h-4 w-4" aria-hidden="true" />
        {current?.label ?? locale.toUpperCase()}
        <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open &&
      <ul
        role="listbox"
        className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-lg border border-navy-100 bg-white py-1 shadow-pop">
        
          {available.map((item) =>
        <li key={item.code}>
              <button
            type="button"
            role="option"
            aria-selected={item.code === locale}
            onClick={() => {
              setLocale(item.code);
              setOpen(false);
            }}
            className={`block w-full px-3 py-2 text-left text-[13px] transition-colors hover:bg-navy-50 ${
            item.code === locale ? 'font-semibold text-teal-700' : 'text-navy-700'}`
            }>
            
                {item.label}
              </button>
            </li>
        )}
        </ul>
      }
    </div>);

}
