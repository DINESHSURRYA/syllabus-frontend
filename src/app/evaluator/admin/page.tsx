"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import ProgressThread from '@/components/ui/evaluator/ProgressThread';

export default function AdminDashboardPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_EVALUATOR_API_URL || 'http://127.0.0.1:8001';
        const res = await fetch(`${baseUrl}/admin/interviews`);
        if (!res.ok) throw new Error("Failed to fetch interviews");
        const data = await res.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen relative flex bg-background text-surface">
          <ProgressThread />
          <main className="flex-1 flex flex-col items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-surface font-mono animate-pulse">Loading Interviews...</p>
          </main>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen relative flex bg-background text-surface">
        <ProgressThread />
        <main className="flex-1 ml-1 pl-4 sm:pl-8 flex flex-col min-h-screen">
          <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
            <div className="mb-8 border-b border-surface/10 pb-6">
              <span className="font-mono text-accent text-sm tracking-widest uppercase mb-2 block">
                Admin Area
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-surface">
                Recent Interviews
              </h1>
            </div>
            
            {interviews.length === 0 ? (
              <p className="text-surface/70 italic text-center py-10">No interviews found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((intv) => (
                  <div 
                    key={intv.thread_id} 
                    onClick={() => router.push(`/evaluator/admin/${intv.thread_id}`)}
                    className="bg-surface/5 border border-surface/10 hover:border-accent/40 rounded-2xl p-6 cursor-pointer transition-all hover:bg-surface/10 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-serif text-xl font-medium text-surface">{intv.topic}</h3>
                      <span className={`text-xs px-2 py-1 rounded-md uppercase font-bold tracking-wide border ${
                        intv.overall_understanding === 'strong' 
                          ? 'text-success border-success/30 bg-success/10' 
                          : intv.overall_understanding === 'moderate' 
                          ? 'text-accent border-accent/30 bg-accent/10' 
                          : 'text-error border-error/30 bg-error/10'
                      }`}>
                        {(intv.overall_understanding || 'moderate').replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-surface/70 mb-4 line-clamp-3">
                      {intv.summary}
                    </p>
                    <p className="text-xs text-surface/50 font-mono text-right truncate">ID: {intv.thread_id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  );
}
