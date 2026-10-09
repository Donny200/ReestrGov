import React from 'react';
import { twMerge } from 'tailwind-merge';

type Tone = 'navy' | 'teal' | 'green' | 'red' | 'gray' | 'amber';

const tones: Record<Tone, string> = {
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  gray: 'bg-navy-50 text-navy-400 ring-navy-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100'
};

export function Badge({
  tone = 'navy',
  className,
  children




}: {tone?: Tone;className?: string;children: React.ReactNode;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

export function StatusBadge({ enabled }: {enabled: boolean;}) {
  return (
    <Badge tone={enabled ? 'green' : 'gray'}>
      <span className={enabled ? 'h-1.5 w-1.5 rounded-full bg-emerald-500' : 'h-1.5 w-1.5 rounded-full bg-navy-300'} />
      {enabled ? 'Faol' : 'Faolsiz'}
    </Badge>);

}