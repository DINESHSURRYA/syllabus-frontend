import './styles/loading.css';
import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2, Waypoints } from 'lucide-react';

export default function TimelineLoading() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
            <Waypoints className="w-8 h-8 text-amber-400" />
          </div>
          <Loader2 className="w-20 h-20 text-amber-500/40 animate-spin absolute" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-mono font-bold text-amber-400 uppercase tracking-widest">
            Loading Teaching Timeline
          </p>
          <p className="text-xs text-slate-400">
            Calculating hour allocations and lecture schedules...
          </p>
        </div>
      </div>
    </AppShell>
  );
}
