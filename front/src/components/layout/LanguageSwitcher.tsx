import { useId } from 'react';
import { ChevronDownIcon, GlobeIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, available, t } = useI18n();
  const selectId = useId();
  const currentIsAvailable = available.some((item) => item.code.toLowerCase() === locale.toLowerCase());

  return (
    <div className={cn('relative inline-flex h-10 max-w-full items-center', className)}>
      <label htmlFor={selectId} className="sr-only">{t('field.language')}</label>
      <GlobeIcon className="pointer-events-none absolute left-3 h-4 w-4 text-content-muted" aria-hidden="true" />
      <select
        id={selectId}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className={cn(
          'h-10 cursor-pointer appearance-none truncate rounded-control border border-line bg-surface/80 py-2 pl-9 pr-9 text-sm font-medium text-content-strong shadow-xs transition-colors duration-fast hover:border-line-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40',
          compact ? 'max-w-32' : 'max-w-[11rem]',
        )}
      >
        {!currentIsAvailable && <option value={locale}>{locale}</option>}
        {available.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-content-muted" aria-hidden="true" />
    </div>
  );
}
