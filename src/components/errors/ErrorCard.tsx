import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ title = 'Something went wrong', message, onRetry }: ErrorCardProps) {
  return (
    <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-slate-900 dark:text-slate-100 flex flex-col items-center text-center gap-3">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-2">
          Try Again
        </Button>
      )}
    </div>
  );
}
