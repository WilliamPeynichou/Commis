import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'mauve' | 'orange' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles = {
  mauve: 'bg-mauve text-deep-black hover:bg-mauve-light',
  orange: 'bg-dark-orange text-white hover:bg-dark-orange-light',
  yellow: 'bg-pale-yellow text-deep-black hover:bg-pale-yellow/80',
};

const sizeStyles = {
  sm: 'px-4 py-2.5 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function BrutalButton({
  variant = 'mauve',
  size = 'md',
  children,
  isLoading,
  className,
  disabled,
  ...props
}: BrutalButtonProps) {
  return (
    <button
      className={cn(
        'btn-brutal font-bold select-none',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed !transform-none !shadow-none',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-thick" />
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
