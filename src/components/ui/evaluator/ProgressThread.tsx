"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

export default function ProgressThread() {
  const pathname = usePathname();

  let progress = "0%";
  if (pathname === '/evaluator' || pathname === '/evaluator/upload') progress = "33%";
  else if (pathname === '/evaluator/interview') progress = "66%";
  else if (pathname === '/evaluator/report') progress = "100%";

  return (
    <div className="fixed left-0 top-0 bottom-0 w-1 bg-surface/10 z-50">
      <div 
        className="w-full bg-accent transition-all duration-700 ease-in-out"
        style={{ height: progress }}
      />
    </div>
  );
}

export { ProgressThread };
