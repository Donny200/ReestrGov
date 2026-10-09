import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className }: {className?: string;}) {
  return <div className={twMerge('animate-pulse rounded-md bg-navy-100', className)} />;
}

export function SkeletonText({ lines = 3, className }: {lines?: number;className?: string;}) {
  return (
    <div className={twMerge('space-y-2', className)} role="status" aria-label="Yuklanmoqda">
      {Array.from({ length: lines }).map((_, index) =>
      <Skeleton key={index} className={index === lines - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
      )}
    </div>);

}

export function SkeletonCards({ count = 6 }: {count?: number;}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Yuklanmoqda">
      {Array.from({ length: count }).map((_, index) =>
      <div key={index} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-5 h-3 w-1/3" />
        </div>
      )}
    </div>);

}

export function SkeletonRows({ rows = 5, columns = 5 }: {rows?: number;columns?: number;}) {
  return (
    <div className="divide-y divide-navy-100" role="status" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }).map((_, rowIndex) =>
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          {Array.from({ length: columns }).map((__, colIndex) =>
        <Skeleton key={colIndex} className={colIndex === 0 ? 'h-3 w-10' : 'h-3 flex-1'} />
        )}
        </div>
      )}
    </div>);

}