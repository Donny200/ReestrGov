import type { ReactNode } from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Tone = 'danger' | 'warning' | 'info' | 'success';

const tones: Record<Tone, string> = {
  danger: 'border-danger/30 bg-danger/10 [&>svg]:text-danger',
  warning: 'border-warning/30 bg-warning/10 [&>svg]:text-warning',
  info: 'border-info/30 bg-info/10 [&>svg]:text-info',
  success: 'border-positive/30 bg-positive/10 [&>svg]:text-positive',
};

const icons = { danger: AlertTriangleIcon, warning: AlertTriangleIcon, info: InfoIcon, success: CheckCircle2Icon };

interface InlineAlertProps {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function InlineAlert({ tone = 'info', children, action, className }: InlineAlertProps) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-3 rounded-control border px-3.5 py-3 text-sm text-content sm:flex-row sm:items-start', tones[tone], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
