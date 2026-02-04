import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BrutalBadgeProps {
  children: ReactNode;
  variant?: 'mauve' | 'orange' | 'yellow' | 'black';
  className?: string;
}

const variants = {
  mauve: 'bg-mauve/80 text-deep-black border-deep-black/30 backdrop-blur-sm',
  orange: 'bg-dark-orange/90 text-white border-deep-black/30 backdrop-blur-sm',
  yellow: 'bg-pale-yellow text-deep-black border-deep-black/20',
  black: 'bg-deep-black text-white border-deep-black',
};

export function BrutalBadge({ children, variant = 'mauve', className }: BrutalBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
