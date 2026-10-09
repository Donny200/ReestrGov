import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, FileTextIcon } from 'lucide-react';
import type { CatalogFunction } from '../../types/api';
import { truncate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/I18nContext';
import { localizedText } from '../../utils/translations';

export function FunctionCard({
  item,
  organizationName



}: {item: CatalogFunction;organizationName: string | undefined;}) {
  const { locale } = useI18n();
  const name = localizedText(item.name, item.nameTranslations, locale);
  const description = localizedText(item.description, item.descriptionTranslations, locale);
  return (
    <Link
      to={`/functions/${item.id}`}
      className="group flex h-full flex-col rounded-xl border border-navy-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-pop">
      
      <div className="flex items-start justify-between gap-3">
        {item.category ? <Badge tone="navy">{item.category}</Badge> : <span />}
        <ArrowUpRightIcon
          className="h-4 w-4 shrink-0 text-navy-300 transition-colors group-hover:text-teal-600"
          aria-hidden="true" />
        
      </div>
      <h3 className="mt-3 font-display text-[15px] font-semibold leading-snug text-navy-900">{name}</h3>
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-navy-500">{truncate(description, 120)}</p>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-navy-400">
        <FileTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {organizationName ?? 'Tashkilot aniqlanmadi'}
      </p>
    </Link>);

}
