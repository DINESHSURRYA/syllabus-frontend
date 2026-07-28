import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2, BarChart3 } from 'lucide-react';

export default function AnalyticsLoading() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
          <Loader2 className="w-20 h-20 text-cyan-500/40 animate-spin absolute" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Loading Analytics Dashboard
          </p>
          <p className="text-xs text-slate-400">
            Rendering Bloom taxonomy charts and time distributions...
          </p>
        </div>
      </div>
    </AppShell>
  );
}
