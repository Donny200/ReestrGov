import { AlertTriangleIcon, ExternalLinkIcon, ShieldCheckIcon, ShieldQuestionIcon } from 'lucide-react';
import { useI18n } from '../../contexts/i18n';
import { formatDate } from '../../utils/format';
import type { VerificationInfo } from '../../types/api';
import { cn } from '../../lib/cn';

export function OfficialSourceLink({ url, className }: { url: string; className?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex max-w-full items-center gap-1.5 rounded-sm font-medium text-accent-text underline-offset-4 wrap-anywhere fine:hover:underline', className)}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 print:hidden" aria-hidden="true" />
      <span className="min-w-0">{t('verification.officialSource', 'Official source')}</span>
      <span className="sr-only"> ({t('a11y.opensInNewTab', 'opens in a new tab')})</span>
      <span className="hidden text-xs font-normal text-secondary print:inline"> {url}</span>
    </a>
  );
}

export function VerificationNotice({ info }: { info: VerificationInfo }) {
  const { t, locale } = useI18n();
  const status = info.verificationStatus ?? 'UNVERIFIED';
  const verified = status === 'VERIFIED' || status === 'DUE';
  const Icon = verified ? ShieldCheckIcon : status === 'OUTDATED' ? AlertTriangleIcon : ShieldQuestionIcon;
  const text = verified
    ? `${t('verification.verifiedOn', 'Checked against the official source on')} ${formatDate(info.lastVerifiedAt, locale)}`
    : status === 'OUTDATED'
      ? t('verification.outdatedPublic', 'This information changed after its last check. A new check against the official source is pending.')
      : t('verification.unverifiedPublic', 'This information has not yet been checked against an official source.');

  return (
    <div className="space-y-2">
      <p className={cn('flex items-start gap-2 text-sm leading-6', verified ? 'text-foreground' : 'text-secondary')}>
        <Icon
          className={cn('mt-1 h-4 w-4 shrink-0', verified ? 'text-status-published' : status === 'OUTDATED' ? 'text-status-pending' : 'text-secondary')}
          aria-hidden="true"
        />
        <span>{text}</span>
      </p>
      {info.officialSourceUrl && <OfficialSourceLink url={info.officialSourceUrl} className="text-sm" />}
    </div>
  );
}
