"use client";
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Assessment Ingestion', path: '/evaluator' },
  { label: 'AI Interview', path: '/evaluator/interview' },
  { label: 'Final Report', path: '/evaluator/report' },
];

function getStepIndex(pathname: string): number {
  if (pathname.includes('/report')) return 2;
  if (pathname.includes('/interview')) return 1;
  return 0;
}

export function ProgressThread() {
  const pathname = usePathname();
  const currentStep = getStepIndex(pathname);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden sm:flex flex-col items-end gap-8">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <div key={step.label} className="flex items-center gap-3 relative flex-row-reverse">
            {/* Thread line above (except first) */}
            {idx > 0 && (
              <div
                className={cn(
                  "absolute -top-8 right-[6px] w-0.5 h-8 transition-colors duration-500",
                  isComplete ? "bg-accent" : "bg-surface/20"
                )}
              />
            )}

            {/* Dot */}
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 shrink-0 z-10",
                isComplete
                  ? "bg-accent border-accent"
                  : isActive
                    ? "bg-background border-accent scale-125 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                    : "bg-background border-surface/20"
              )}
            />

            {/* Label */}
            <div
              className={cn(
                "pointer-events-auto hidden md:block font-mono text-[10px] tracking-widest uppercase transition-all duration-300 select-none whitespace-nowrap text-right",
                isActive
                  ? "text-accent font-bold"
                  : isComplete
                    ? "text-accent/70"
                    : "text-surface/30"
              )}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressThread;
