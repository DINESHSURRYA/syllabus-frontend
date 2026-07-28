import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2, BookOpen } from 'lucide-react';

export default function CurriculumLoading() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <Loader2 className="w-20 h-20 text-indigo-500/40 animate-spin absolute" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-widest">
            Loading Curriculum Tree
          </p>
          <p className="text-xs text-slate-400">
            Constructing pedagogical mappings and unit hierarchies...
          </p>
        </div>
      </div>
    </AppShell>
  );
}
