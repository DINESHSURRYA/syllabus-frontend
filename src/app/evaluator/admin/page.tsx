"use client";
import './styles/page.css';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Search,
  User,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { fetchAdminInterviews, AdminInterviewSummary } from '@/lib/evaluator-api';
import { cn } from '@/lib/utils';

function getUnderstandingColor(level?: string) {
  if (!level) return 'text-muted border-muted/30 bg-muted/10';
  const l = level.toLowerCase();
  if (l.includes('master') || l.includes('proficient') || l.includes('strong') || l.includes('pass')) {
    return 'text-success border-success/30 bg-success/10';
  }
  if (l.includes('remediation') || l.includes('moderate') || l.includes('needs')) {
    return 'text-accent border-accent/30 bg-accent/10';
  }
  if (l.includes('unsatisfactory') || l.includes('weak') || l.includes('fail')) {
    return 'text-error border-error/30 bg-error/10';
  }
  return 'text-accent border-accent/30 bg-accent/10';
}

function isUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export default function AdminDashboardPage() {
  const [interviews, setInterviews] = useState<AdminInterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateFilter, setSelectedCandidateFilter] = useState('ALL');
  const router = useRouter();

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const data = await fetchAdminInterviews();
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  // Dynamic list of unique candidate names / IDs for dropdown selection
  const uniqueCandidateOptions = useMemo(() => {
    const map = new Map<string, string>();
    interviews.forEach((item) => {
      const id = item.candidate_id || item.thread_id;
      let label = item.candidate_name || id;
      if (isUuid(label)) {
        label = `Candidate (${label.slice(0, 8)}...)`;
      }
      map.set(id, label);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [interviews]);

  // Filtered interviews list
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const candName = item.candidate_name || '';
      const candId = item.candidate_id || item.thread_id || '';
      const assName = item.assessment_name || item.topic || '';

      const matchesDropdown =
        selectedCandidateFilter === 'ALL' ||
        item.candidate_id === selectedCandidateFilter ||
        item.thread_id === selectedCandidateFilter;

      const matchesSearch =
        !q ||
        candName.toLowerCase().includes(q) ||
        candId.toLowerCase().includes(q) ||
        assName.toLowerCase().includes(q);

      return matchesDropdown && matchesSearch;
    });
  }, [interviews, searchQuery, selectedCandidateFilter]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-surface font-mono animate-pulse">Loading Diagnostic Session Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* Back */}
      <button
        onClick={() => router.push('/evaluator')}
        className="flex items-center gap-2 text-surface/70 hover:text-accent transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Evaluator
      </button>

      {/* Page Header */}
      <div className="mb-8 border-b border-surface/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-accent text-sm tracking-widest uppercase mb-1 block">
            Session Dashboard
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-surface font-semibold">
            Diagnostic Reports & AI Interviews
          </h1>
          <p className="text-surface/70 text-sm mt-1">
            Search candidates, inspect completed diagnostic sessions, and view evaluation reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface/5 border border-surface/10 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-surface/50 font-mono block">Total Sessions</span>
            <span className="text-lg font-bold text-surface font-mono">{interviews.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface/5 border border-surface/10 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, candidate ID, or assessment title..."
            className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-surface/10 rounded-xl text-sm text-surface placeholder:text-surface/40 focus:outline-none focus:border-accent transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface/50 hover:text-surface"
            >
              Clear
            </button>
          )}
        </div>

        {/* Candidate Dropdown Filter */}
        <div className="w-full sm:w-64 relative">
          <select
            value={selectedCandidateFilter}
            onChange={(e) => setSelectedCandidateFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-background/60 border border-surface/10 rounded-xl text-sm text-surface focus:outline-none focus:border-accent transition-all font-mono appearance-none pr-8 cursor-pointer"
          >
            <option value="ALL">All Candidates ({uniqueCandidateOptions.length})</option>
            {uniqueCandidateOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-surface/40 pointer-events-none" />
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-surface/5 border border-surface/10 rounded-2xl p-12 text-center">
          <User className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <p className="text-surface font-medium mb-1">No matching diagnostic interviews found</p>
          <p className="text-surface/50 text-xs mb-6 max-w-md mx-auto">
            Try adjusting your search query or candidate selection filter.
          </p>

          <button
            onClick={() => { setSearchQuery(''); setSelectedCandidateFilter('ALL'); }}
            className="px-6 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-medium hover:bg-accent/20 transition-all text-xs font-mono"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInterviews.map((intv) => {
            const rawName = intv.candidate_name || 'Candidate';
            const displayCandidateName = isUuid(rawName) ? 'Candidate (Diagnostic Attempt)' : rawName;
            const displayAssessmentName = intv.assessment_name || intv.topic || 'AI Diagnostic Interview';
            const candidateId = intv.candidate_id || intv.thread_id;

            return (
              <div
                key={intv.thread_id}
                className="bg-surface/5 border border-surface/10 hover:border-accent/40 rounded-2xl p-6 transition-all hover:bg-surface/10 group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Candidate Name & Score Pill */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-surface line-clamp-1">
                          {displayCandidateName}
                        </h3>
                        <span className="text-xs text-surface/60 font-mono block line-clamp-1">
                          {displayAssessmentName}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wide border shrink-0 font-mono",
                      getUnderstandingColor(intv.overall_understanding)
                    )}>
                      {intv.overall_score !== undefined && intv.overall_score !== null
                        ? `${intv.overall_score}%`
                        : (intv.overall_understanding || 'COMPLETED').replace('_', ' ')}
                    </span>
                  </div>

                  {/* Summary / Diagnostic Description */}
                  <p className="text-xs text-surface/70 mb-4 line-clamp-3 leading-relaxed bg-surface/5 p-3 rounded-xl border border-surface/5">
                    {intv.summary}
                  </p>
                </div>

                {/* Footer with Candidate ID & Action Buttons */}
                <div className="pt-4 border-t border-surface/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-surface/40 font-mono truncate text-[11px]" title={candidateId}>
                    ID: {candidateId.length > 20 ? `${candidateId.slice(0, 18)}...` : candidateId}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/evaluator/admin/transcript/${intv.thread_id}`)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-surface/20 text-surface/80 hover:text-white hover:border-accent transition-all font-mono text-xs flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Transcript
                    </button>
                    <button
                      onClick={() => router.push(`/evaluator/report?id=${intv.thread_id}`)}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all font-mono text-xs font-medium shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
