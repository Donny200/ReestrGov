import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, BuildingIcon } from 'lucide-react';
import type { PublicOrganization } from '../../types/api';
import { truncate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/I18nContext';
import { localizedText } from '../../utils/translations';

export function OrganizationCard({ organization, functionCount }: {organization: PublicOrganization;functionCount: number;}) {
  const { locale, t } = useI18n();
  const name = localizedText(organization.name, organization.nameTranslations, locale);
  const description = localizedText(organization.description, organization.descriptionTranslations, locale);
  return (
    <Link
      to={`/organizations/${organization.id}`}
      className="group flex h-full flex-col rounded-xl border border-navy-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-pop">
      
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
        <BuildingIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-[15px] font-semibold leading-snug text-navy-900">{name}</h3>
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-navy-500">{truncate(description, 130)}</p>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone="teal">{functionCount} {t('nav.functions')}</Badge>
        <ArrowRightIcon
          className="h-4 w-4 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600"
          aria-hidden="true" />
        
      </div>
    </Link>);

}
