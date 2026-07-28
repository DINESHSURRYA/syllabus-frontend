import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shimmer-loader rounded-xl opacity-75',
        className
      )}
      {...props}
    />
  );
}

export function HierarchySkeleton() {
  return (
    <div className="space-y-4 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="ml-2 border-l border-[var(--border-subtle)] pl-4 space-y-3">
          <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
