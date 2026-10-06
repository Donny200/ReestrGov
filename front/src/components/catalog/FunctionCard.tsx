import { ArrowUpRightIcon, Building2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CatalogFunction } from '../../types/api';
import { truncate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';

interface FunctionCardProps {
  item: CatalogFunction;
  organizationName: string | undefined;
}

export function FunctionCard({ item, organizationName }: FunctionCardProps) {
  const { t, locale } = useI18n();
  const name = localizedText(item.name, item.nameTranslations, locale);
  const description = localizedText(item.description, item.descriptionTranslations, locale);

  return (
    <Link
      to={`/functions/${item.id}`}
      className="group lift relative flex h-full min-w-0 flex-col overflow-hidden rounded-surface border border-line bg-surface p-5 shadow-card hover:border-brand/40 sm:p-6"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand-gradient opacity-0 transition-opacity duration-base group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex min-h-7 items-start justify-between gap-3">
        {item.category ? <Badge tone="brand" className="max-w-[80%] truncate">{item.category}</Badge> : <span />}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-content-muted transition-colors duration-base group-hover:border-brand/40 group-hover:bg-brand-subtle group-hover:text-link">
          <ArrowUpRightIcon
            className="h-4 w-4 transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </span>
      </div>

      <h3 className="mt-4 break-words font-display text-base font-semibold leading-6 tracking-tight text-content-strong">{name}</h3>
      <p className="mt-2.5 flex-1 break-words text-[13px] leading-6 text-content-muted">{truncate(description, 120)}</p>

      <p className="mt-5 flex min-w-0 items-center gap-2 border-t border-line/80 pt-4 text-xs font-medium text-content-muted">
        <Building2Icon className="h-4 w-4 shrink-0 text-content-subtle" aria-hidden="true" />
        <span className="truncate">{organizationName ?? t('fn.organizationUnknown', 'Organization unknown')}</span>
      </p>
    </Link>
  );
}
