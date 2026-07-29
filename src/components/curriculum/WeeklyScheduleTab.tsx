"use client";
import './styles/WeeklyScheduleTab.css';
import React from "react";
import { Calendar, BookOpen, Layers, CheckSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WeeklyScheduleTabProps {
  units?: any[];
}

export const WeeklyScheduleTab: React.FC<WeeklyScheduleTabProps> = ({ units = [] }) => {
  const weeks = Array.from({ length: 12 }, (_, i) => ({
    weekNumber: i + 1,
    unitTitle: units[i % (units.length || 1)]?.title || `Unit ${(i % 5) + 1}`,
    topics: [`Topic ${i * 2 + 1}: Fundamentals`, `Topic ${i * 2 + 2}: Advanced Principles`],
    periods: 3,
    pedagogy: i % 2 === 0 ? "Problem-Based Learning" : "Active Learning",
    activity: i % 2 === 0 ? "Group Code Audit & Refactoring" : "Think-Pair-Share Conceptual Trace",
    assessment: i % 3 === 0 ? "Hands-On Lab Benchmark" : "Formative Concept Quiz"
  }));

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Smart Weekly Teaching Schedule Matrix
          </CardTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Chronological 12-week semester layout mapping Units, Periods, Topics, Pedagogy Categories, Activities, and Assessments.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeks.map((w) => (
              <div 
                key={w.weekNumber}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-hover)] space-y-3 text-xs"
              >
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="font-mono font-bold text-indigo-400">Week #{w.weekNumber}</span>
                  <span className="text-[var(--text-muted)] font-mono">{w.periods} Periods</span>
                </div>

                <div className="font-bold text-[var(--text-primary)] text-sm">{w.unitTitle}</div>

                <div className="space-y-1 text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Topics:</strong>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {w.topics.map((t, tIdx) => <li key={tIdx}>{t}</li>)}
                  </ul>
                </div>

                <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300">
                  <strong>Pedagogy:</strong> {w.pedagogy}
                </div>

                <div className="text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Activity:</strong> {w.activity}
                </div>

                <div className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> Assessment: {w.assessment}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
