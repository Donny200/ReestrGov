import { GlobeIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';
import { Select } from '../ui/Select';

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, available, t } = useI18n();
  const known = available.some((item) => item.code.toLowerCase() === locale.toLowerCase());
  const languages = known ? available : [{ code: locale, label: locale.toUpperCase() }, ...available];

  return (
    <Select
      aria-label={t('field.language')}
      value={locale}
      onValueChange={setLocale}
      options={languages.map((item) => ({ value: item.code, label: item.label, description: item.code.toUpperCase() }))}
      leadingIcon={<GlobeIcon />}
      variant="glass"
      align="end"
      className={cn('font-medium', compact ? 'w-auto max-w-44' : 'w-full', className)}
      contentClassName="min-w-[12rem]"
    />
  );
}
