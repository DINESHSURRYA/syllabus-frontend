"use client";
import './styles/layout.css';
import React, { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ProgressThread } from '@/components/ui/evaluator/ProgressThread';
import { InterviewProvider } from '@/context/InterviewContext';

export default function EvaluatorLayout({ children }: { children: ReactNode }) {
  return (
    <InterviewProvider>
      <AppShell>
        <ProgressThread />
        <div className="pl-1">
          {children}
        </div>
      </AppShell>
    </InterviewProvider>
  );
}

