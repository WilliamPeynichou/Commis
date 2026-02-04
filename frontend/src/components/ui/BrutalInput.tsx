import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function BrutalInput({ label, className, id, ...props }: BrutalInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-bold text-deep-black text-sm uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn('input-brutal', className)}
        {...props}
      />
    </div>
  );
}
