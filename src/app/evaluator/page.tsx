"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EvaluatorIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/evaluator/upload');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-sm font-mono text-[var(--text-muted)] animate-pulse">
        <span>Initializing Diagnostic Evaluator Module...</span>
      </div>
    </div>
  );
}
