import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';
import { statusLabels, type FunctionStatus } from '../../types/adminFunctions';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-surface-subtle text-content-muted',
        brand: 'border-brand/20 bg-brand-subtle text-link',
        success: 'border-positive/25 bg-positive/10 text-positive',
        warning: 'border-warning/25 bg-warning/10 text-warning',
        danger: 'border-danger/25 bg-danger/10 text-danger',
        info: 'border-info/25 bg-info/10 text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;
type LegacyTone = 'navy' | 'teal' | 'green' | 'red' | 'gray' | 'amber';

const legacyTones: Record<LegacyTone, BadgeTone> = {
  navy: 'brand',
  teal: 'brand',
  green: 'success',
  red: 'danger',
  gray: 'neutral',
  amber: 'warning',
};

interface BadgeProps {
  tone?: BadgeTone | LegacyTone;
  dot?: boolean;
  glow?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, glow = false, className, children }: BadgeProps) {
  const resolved: BadgeTone = tone in legacyTones ? legacyTones[tone as LegacyTone] : (tone as BadgeTone);
  return (
    <span className={cn(badgeVariants({ tone: resolved }), className)}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full bg-current', glow && 'shadow-[0_0_8px_currentColor]')}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  return (
    <Badge tone={enabled ? 'success' : 'neutral'} dot glow={enabled}>
      {enabled ? t('status.active') : t('status.inactive')}
    </Badge>
  );
}

const functionTones: Record<FunctionStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  DEACTIVATED: 'danger',
};

export function FunctionStatusBadge({ status }: { status: FunctionStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={functionTones[status]} dot glow={status === 'PUBLISHED'}>
      {t(`fnAdmin.status.${status}`, statusLabels[status])}
    </Badge>
  );
}
