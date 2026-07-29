import React from 'react';
import { Spinner } from './Spinner';

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Loading page...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
      <Spinner size="lg" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
