"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Brain, Sparkles } from 'lucide-react';

const DIFFICULTY_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'];
const BLOOM_COLORS = ['#94a3b8', '#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#8b5cf6'];

interface AnalyticsChartsProps {
  unitCount: number;
  hoursData: Array<{ name: string; value: number }>;
  difficultyData: Array<{ name: string; value: number; percentage?: number }>;
  bloomData?: Array<{ name: string; value: number; percentage?: number }>;
  topPedagogies?: Array<{ name: string; count: number; percentage?: number }>;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md text-xs font-mono text-white">
        <p className="font-bold text-cyan-300">{label || payload[0].name}</p>
        <p className="mt-1 text-slate-200">
          Count / Value: <span className="font-bold text-white">{payload[0].value}</span>
        </p>
        {payload[0].payload?.percentage !== undefined && (
          <p className="text-slate-400 text-[11px]">
            Share: <span className="text-emerald-400 font-bold">{payload[0].payload.percentage}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function AnalyticsCharts({
  unitCount,
  hoursData,
  difficultyData,
  bloomData = [],
  topPedagogies = [],
  isLoading = false,
}: AnalyticsChartsProps) {
  const hasData = unitCount > 0;
  const hasBloomData = bloomData.some((d) => d.value > 0);

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900/40 p-8 flex flex-col items-center justify-center text-xs font-mono text-cyan-400 animate-pulse gap-3">
          <Sparkles className="w-6 h-6 animate-spin text-cyan-400" />
          Calculating real-time syllabus analytics metrics...
        </div>
        <div className="h-80 w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900/40 p-8 flex flex-col items-center justify-center text-xs font-mono text-indigo-400 animate-pulse gap-3">
          <Sparkles className="w-6 h-6 animate-spin text-indigo-400" />
          Building cognitive levels &amp; difficulty distribution...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {/* 1. Hierarchy & Learning Hours Breakdown Chart */}
        <Card className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
          <CardHeader className="p-6 border-b dark:border-white/10 border-slate-200/80 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Hierarchy &amp; Topic Depth Breakdown
            </CardTitle>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Structural
            </span>
          </CardHeader>
          <CardContent className="h-72 p-6">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1">
                    {hoursData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#6366f1' : index === 2 ? '#06b6d4' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs font-mono text-slate-400">
                <BarChart3 className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
                Upload or select a saved syllabus to view structural hierarchy breakdown.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Topic Difficulty Distribution Chart */}
        <Card className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
          <CardHeader className="p-6 border-b dark:border-white/10 border-slate-200/80 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-cyan-500" />
              Difficulty Distribution
            </CardTitle>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Complexity
            </span>
          </CardHeader>
          <CardContent className="h-72 p-6 flex items-center justify-center">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percentage }) => `${name} (${percentage || 0}%)`}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs font-mono text-slate-400">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
                No difficulty metrics available until a syllabus is extracted.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Bloom's Taxonomy / Cognitive Level Breakdown Chart */}
      <Card className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
        <CardHeader className="p-6 border-b dark:border-white/10 border-slate-200/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              Bloom's Taxonomy / Cognitive Level Breakdown
            </CardTitle>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
              Distribution of learning objectives across cognitive depth levels
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Cognitive
          </span>
        </CardHeader>
        <CardContent className="h-72 p-6">
          {hasData && hasBloomData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloomData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#10b981">
                  {bloomData.map((_, index) => (
                    <Cell key={`bloom-cell-${index}`} fill={BLOOM_COLORS[index % BLOOM_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs font-mono text-slate-400">
              <Brain className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
              {hasData
                ? "Bloom's taxonomy categorization will generate as topics are processed."
                : "Upload or load a syllabus to analyze cognitive level distribution."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

