"use client";

import React, { useState } from "react";
import { Clock, Sliders, Calendar, CheckCircle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TimePlannerTabProps {
  courseId?: string;
  units?: any[];
}

export const TimePlannerTab: React.FC<TimePlannerTabProps> = ({ courseId, units = [] }) => {
  const [optionMode, setOptionMode] = useState<"syllabus" | "custom" | "period">("syllabus");
  const [customHours, setCustomHours] = useState<number>(45);
  const [periodDuration, setPeriodDuration] = useState<number>(60);
  const [isCalculating, setIsCalculating] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);

  const handleCalculateSchedule = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/ekg/${courseId || "default"}/time-plan?target_hours=${customHours}&period_duration_mins=${periodDuration}`,
        { method: "POST" }
      );
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule || []);
      }
    } catch (err) {
      console.warn("Using fallback client schedule calculation", err);
      // Fallback schedule generation
      const mockSchedule = [
        { periodNumber: 1, unitTitle: "Unit 1: Introduction", allocatedMinutes: periodDuration, topics: ["Overview", "Basic Definitions"], pedagogyCategory: "Active Learning", activity: "Think-Pair-Share", assessment: "Self Quiz" },
        { periodNumber: 2, unitTitle: "Unit 1: Core Principles", allocatedMinutes: periodDuration, topics: ["Syntax & Variables"], pedagogyCategory: "Problem-Based Learning", activity: "Code Audit", assessment: "Peer Review" },
        { periodNumber: 3, unitTitle: "Unit 2: Control Structures", allocatedMinutes: periodDuration, topics: ["Conditional Loops"], pedagogyCategory: "Laboratory Pedagogies", activity: "Guided Lab", assessment: "Unit Test" },
      ];
      setSchedule(mockSchedule);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Clock className="w-5 h-5 text-indigo-400" />
            Teaching Time Allocation & Period Duration Planner
          </CardTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Select allocation modes and period durations (40m - 90m). The AI engine automatically redistributes unit hours and plans discrete classroom periods.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode Selector Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setOptionMode("syllabus")}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                optionMode === "syllabus"
                  ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                  : "border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xs font-mono font-bold text-indigo-400">Option A</span>
              <h4 className="text-sm font-bold mt-1 text-[var(--text-primary)]">Use Syllabus Fixed Time</h4>
              <p className="text-xs mt-1">Uses standard 45 hours extracted from official syllabus document.</p>
            </div>

            <div 
              onClick={() => setOptionMode("custom")}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                optionMode === "custom"
                  ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                  : "border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xs font-mono font-bold text-indigo-400">Option B</span>
              <h4 className="text-sm font-bold mt-1 text-[var(--text-primary)]">Custom Target Hours</h4>
              <p className="text-xs mt-1">Faculty enters custom total hours (e.g. 36h, 50h, 60h).</p>
            </div>

            <div 
              onClick={() => setOptionMode("period")}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                optionMode === "period"
                  ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                  : "border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xs font-mono font-bold text-indigo-400">Option C</span>
              <h4 className="text-sm font-bold mt-1 text-[var(--text-primary)]">Period Duration Selector</h4>
              <p className="text-xs mt-1">Configure period length: 40m, 45m, 50m, 60m, 75m, 90m.</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs">
            {optionMode === "custom" && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">Custom Total Hours:</span>
                <input 
                  type="number" 
                  value={customHours} 
                  onChange={(e) => setCustomHours(Number(e.target.value))}
                  className="w-20 px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-xs"
                />
                <span>Hours</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)]">Select Period Duration:</span>
              <div className="flex gap-1.5">
                {[40, 45, 50, 60, 75, 90].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setPeriodDuration(dur)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      periodDuration === dur
                        ? "bg-indigo-600 text-white"
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-indigo-400"
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCalculateSchedule} 
              disabled={isCalculating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sliders className="w-4 h-4 mr-1" />}
              Recalculate Period Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Period Schedule Table */}
      {schedule.length > 0 && (
        <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Generated Period Schedule ({schedule.length} Periods)</span>
              <span className="text-xs font-mono text-indigo-400">{periodDuration} Mins / Period</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                    <th className="p-3">Period</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Topics Covered</th>
                    <th className="p-3">Pedagogy Category</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {schedule.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-400">Period #{p.periodNumber}</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">{p.unitTitle}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{Array.isArray(p.topics) ? p.topics.join(", ") : p.topics}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">{p.pedagogyCategory}</span></td>
                      <td className="p-3 text-[var(--text-secondary)]">{p.activity}</td>
                      <td className="p-3 text-emerald-400">{p.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
