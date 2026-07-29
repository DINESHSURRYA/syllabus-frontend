import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn('bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 ease-out', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
