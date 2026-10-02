import * as Menu from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({ className, align = 'end', ...props }: Menu.DropdownMenuContentProps) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={6}
        className={cn('glass-strong z-50 min-w-[11rem] overflow-hidden rounded-xl p-1 text-content shadow-pop animate-fade-up', className)}
        {...props}
      />
    </Menu.Portal>
  );
}

export function DropdownMenuItem({ className, destructive = false, ...props }: Menu.DropdownMenuItemProps & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-fast data-[highlighted]:bg-surface-subtle data-[highlighted]:text-content-strong data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-content-muted',
        destructive && 'text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger [&>svg]:text-danger',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel(props: Menu.DropdownMenuLabelProps) {
  return <Menu.Label className="px-2.5 py-1.5 text-xs font-medium text-content-muted" {...props} />;
}

export function DropdownMenuSeparator(props: Menu.DropdownMenuSeparatorProps) {
  return <Menu.Separator className="my-1 h-px bg-line" {...props} />;
}
