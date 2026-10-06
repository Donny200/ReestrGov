import { ArrowRightIcon, Building2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicOrganization } from '../../types/api';
import { truncate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';

interface OrganizationCardProps {
  organization: PublicOrganization;
  functionCount: number;
}

export function OrganizationCard({ organization, functionCount }: OrganizationCardProps) {
  const { locale, t } = useI18n();
  const name = localizedText(organization.name, organization.nameTranslations, locale);
  const description = localizedText(organization.description, organization.descriptionTranslations, locale);

  return (
    <Link
      to={`/organizations/${organization.id}`}
      className="group lift relative flex h-full min-w-0 flex-col overflow-hidden rounded-surface border border-line bg-surface p-5 shadow-card hover:border-brand/40 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-gradient-soft text-link">
          <Building2Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-content-muted transition-colors duration-base group-hover:border-brand group-hover:bg-brand group-hover:text-brand-fg">
          <ArrowRightIcon
            className="h-4 w-4 transition-transform duration-base group-hover:translate-x-0.5 motion-reduce:transform-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>

      <h3 className="mt-5 break-words font-display text-lg font-semibold leading-6 tracking-tight text-content-strong">{name}</h3>
      <p className="mt-2.5 flex-1 break-words text-[13px] leading-6 text-content-muted">{truncate(description, 130)}</p>

      <div className="mt-5 border-t border-line/80 pt-4">
        <Badge tone="accent">{functionCount} {t('nav.functions')}</Badge>
      </div>
    </Link>
  );
}
