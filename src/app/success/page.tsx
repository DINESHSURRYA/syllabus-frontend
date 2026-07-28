"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, CalendarDays, Layers3 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-gradient-to-br dark:from-emerald-500/10 dark:via-slate-900 dark:to-brand-500/10 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 size={40} />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
            <Sparkles size={14} /> Stage 2 Complete
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Processing Completed Successfully</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
            Your syllabus JSON has been parsed, graph-validated, verified, and saved to the persistent database.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md">
              <Link href="/curriculum">
                <Layers3 size={16} className="mr-2" /> View Curriculum Hierarchy
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-slate-300 dark:border-white/20 bg-white dark:bg-black/60 text-slate-800 dark:text-slate-200" asChild>
              <Link href="/timeline">
                <CalendarDays size={16} className="mr-2" /> Generate Teaching Timeline
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10" asChild>
              <Link href="/upload">Upload Another Syllabus</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
