import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BrutalCardProps {
  children: ReactNode;
  className?: string;
  headerColor?: string;
  headerContent?: ReactNode;
  delay?: number;
}

export function BrutalCard({
  children,
  className,
  headerColor,
  headerContent,
  delay = 0,
}: BrutalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay,
      }}
      className={cn('card-brutal overflow-hidden', className)}
    >
      {headerContent && (
        <div
          className={cn(
            'px-5 py-3 border-b-4 border-deep-black font-bold text-lg',
            headerColor
          )}
        >
          {headerContent}
        </div>
      )}
      <div className="p-5">{children}</div>
    </motion.div>
  );
}
