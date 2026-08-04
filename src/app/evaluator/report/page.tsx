"use client";
import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import ProgressThread from '@/components/ui/evaluator/ProgressThread';
import ReportScreen from '@/components/ui/evaluator/ReportScreen';

export default function EvaluatorReportPage() {
  return (
    <AppShell>
      <div className="min-h-screen relative flex bg-background text-surface">
        <ProgressThread />
        <main className="flex-1 ml-1 pl-4 sm:pl-8 flex flex-col min-h-screen">
          <ReportScreen />
        </main>
      </div>
    </AppShell>
  );
}
