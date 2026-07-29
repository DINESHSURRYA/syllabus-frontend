"use client";
import './styles/page.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, CalendarDays, Layers3, Sparkles, Library, GraduationCap, Award, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AnalyticsCard } from '@/components/analytics-card';
import { Button } from '@/components/ui/button';
import { dashboardApi } from '@/lib/api';
import { useGuideStore } from '@/stores';

export default function DashboardPage() {
  const [totalSyllabiCount, setTotalSyllabiCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true);
  const { highlightedTargetId } = useGuideStore();

  useEffect(() => {
    async function fetchSyllabiCount() {
      try {
        const count = await dashboardApi.getSyllabusCount();
        setTotalSyllabiCount(count);
      } catch (err) {
        console.warn("Could not fetch total syllabi count:", err);
        setTotalSyllabiCount(0); // fallback
      } finally {
        setIsLoadingCount(false);
      }
    }
    fetchSyllabiCount();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Banner Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-slate-200/90 dark:border-cyan-500/25 bg-white dark:bg-black/70 p-8 backdrop-blur-2xl shadow-lg dark:shadow-[0_0_40px_rgba(6,182,212,0.1)]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-cyan-500/30 bg-indigo-50 dark:bg-cyan-500/10 px-3.5 py-1 text-xs font-mono text-indigo-700 dark:text-cyan-300 font-semibold">
                <Sparkles size={14} /> AI-POWERED CURRICULUM STUDIO
              </div>
              <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Plan smarter courses with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-emerald-400">Syllabus AI</span> Studio.
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Upload a syllabus, extract course structures with backend LLM agents, verify DAG graphs, and generate adaptive teaching timelines.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                id="guide-upload-btn"
                asChild
                size="lg"
                className={`bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md transition-all ${
                  highlightedTargetId === 'guide-upload-btn'
                    ? 'ring-4 ring-cyan-400 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.8)] animate-pulse scale-105'
                    : 'dark:shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                }`}
              >
                <Link href="/upload">Upload Syllabus <ArrowRight size={16} className="ml-2" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="border-slate-300 dark:border-white/20 bg-white dark:bg-black/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10" asChild>
                <Link href="/curriculum">Open curriculum</Link>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Metrics Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Summary Metric: Total Syllabi Count */}
          <AnalyticsCard
            title="Total Syllabi Count"
            value={isLoadingCount ? "..." : String(totalSyllabiCount)}
            delta={isLoadingCount ? "Fetching database count..." : "Total count of uploaded & extracted syllabi from repository"}
            href="/syllabus"
          />

          {/* Prominent 30 Pedagogies Catalog Card */}
          <motion.div
            id="guide-pedagogy-card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[30px] transition-all ${
              highlightedTargetId === 'guide-pedagogy-card'
                ? 'ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.7)] animate-pulse'
                : ''
            }`}
          >
            <Link
              href="/curriculum?tab=pedagogy"
              className="group block h-full rounded-[30px] border border-indigo-200/80 dark:border-cyan-500/30 bg-gradient-to-br from-indigo-50/80 via-white to-cyan-50/50 dark:from-cyan-950/40 dark:via-black/70 dark:to-indigo-950/30 p-6 backdrop-blur-2xl shadow-md dark:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-400 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit size={90} className="text-cyan-400" />
              </div>
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  <BrainCircuit size={24} />
                </div>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 font-mono text-xs font-bold text-cyan-300 flex items-center gap-1">
                  EXPLORE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-300 transition-colors">
                30 Pedagogies Catalog
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                Browse 30 instructional pedagogy categories &amp; 150+ teaching models with active learning strategies for syllabus optimization.
              </p>
            </Link>
          </motion.div>
        </div>

        {/* Recommended Actions */}
        <motion.section
          id="guide-recommended-actions"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[32px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-2xl shadow-md transition-all ${
            highlightedTargetId === 'guide-recommended-actions'
              ? 'ring-4 ring-indigo-500/70 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.5)] animate-pulse'
              : 'dark:shadow-[0_0_30px_rgba(0,0,0,0.8)]'
          }`}
        >
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Recommended Actions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Award,
                title: 'CO-PO Mapping',
                detail: 'Map course outcomes to program outcomes & Bloom taxonomy',
                href: '/curriculum'
              },
              {
                icon: BookOpen,
                title: 'Hierarchical',
                subtitle: '(Curriculum Tree)',
                detail: 'Inspect curriculum tree, DAG concepts & prerequisite graphs',
                href: '/curriculum'
              },
              {
                icon: BrainCircuit,
                title: 'Pedagogy',
                detail: 'Explore 30 instructional pedagogies & engagement strategies',
                href: '/curriculum?tab=pedagogy'
              },
              {
                icon: CalendarDays,
                title: 'Teaching Plan',
                detail: 'Convert syllabus units into adaptive teaching timelines',
                href: '/timeline'
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-xl border border-indigo-200 dark:border-cyan-500/30 bg-indigo-50 dark:bg-cyan-500/10 p-2.5 text-indigo-600 dark:text-cyan-300 group-hover:scale-105 transition-transform">
                        <Icon size={18} />
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-bold">0{idx + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-300 transition-colors">
                      {item.title} {item.subtitle && <span className="font-normal text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.detail}</p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Launch <ArrowRight size={12} className="ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
