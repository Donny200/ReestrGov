import React from 'react';
import { Link } from 'react-router-dom';
import { LayersIcon } from 'lucide-react';

/** Wordmark only — deliberately no state emblem, this is a demo product. */
export function Logo({ to = '/', tone = 'dark' }: {to?: string;tone?: 'dark' | 'light';}) {
  const isLight = tone === 'light';
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        isLight ? 'bg-white/15 text-white' : 'bg-navy-800 text-white'}`
        }>
        
        <LayersIcon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-[17px] font-extrabold tracking-tight ${
          isLight ? 'text-white' : 'text-navy-900'}`
          }>
          
          Reestr Task
        </span>
        <span className={`block text-[11px] ${isLight ? 'text-white/70' : 'text-navy-400'}`}>
          Davlat xizmatlari katalogi
        </span>
      </span>
    </Link>);

}