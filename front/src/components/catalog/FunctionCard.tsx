import { ArrowUpRightIcon, Building2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CatalogFunction } from '../../types/api';
import { truncate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';

export function FunctionCard({
  item,
  organizationName
}: {
  item: CatalogFunction;
  organizationName: string | undefined;
}) {
  const { locale } = useI18n();
  const name = localizedText(item.name, item.nameTranslations, locale);
  const description = localizedText(item.description, item.descriptionTranslations, locale);

  return (
    <Link
      to={`/functions/${item.id}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-surface border border-line bg-surface p-5 shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-pop motion-reduce:transform-none sm:p-6"
    >
      <div className="flex min-h-7 items-start justify-between gap-3">
        {item.category ? <Badge tone="navy" className="max-w-[80%] truncate">{item.category}</Badge> : <span />}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-content-muted transition-colors group-hover:border-accent/50 group-hover:bg-accent-subtle group-hover:text-accent">
          <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <h3 className="mt-4 break-words font-display text-base font-bold leading-6 tracking-tight text-navy-950">{name}</h3>
      <p className="mt-2.5 flex-1 break-words text-[13px] leading-6 text-navy-500">{truncate(description, 120)}</p>

      <p className="mt-5 flex min-w-0 items-center gap-2 border-t border-navy-100 pt-4 text-xs font-medium text-navy-500">
        <Building2Icon className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
        <span className="truncate">{organizationName ?? 'Tashkilot aniqlanmadi'}</span>
      </p>
    </Link>
  );
}
