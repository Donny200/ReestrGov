import { cn } from '../../lib/cn';
import { initials } from '../../utils/format';

interface AvatarProps {
  user: { firstName: string; lastName: string };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-control bg-brand-gradient font-semibold tracking-wide text-white shadow-xs', sizes[size], className)}
    >
      {initials(user)}
    </span>
  );
}
