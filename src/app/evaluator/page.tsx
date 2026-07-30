"use client";
import './styles/page.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Search,
  Sparkles,
  ChevronDown,
  Check,
  BrainCircuit,
  BookOpen,
  AlertCircle,
  Loader2,
  ArrowRight,
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchInterviewCandidates,
  fetchCandidateAssessments,
  generateAIInterview,
  uploadJsonPayload,
  startInterview,
  InterviewCandidate,
  CandidateAssessmentAttempt,
} from '@/lib/evaluator-api';
import { client } from '@/lib/api/client';
import { FileDropzone } from '@/components/ui/evaluator/FileDropzone';
import { cn } from '@/lib/utils';

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type InputMode = 'database' | 'upload';

export default function EvaluatorIndexPage() {
  const router = useRouter();

  const [inputMode, setInputMode] = useState<InputMode>('database');

  // ── Candidate Selection State ─────────────────────────────
  const [candidates, setCandidates] = useState<InterviewCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<InterviewCandidate | null>(null);
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false);

  // ── Assessment Attempts State ─────────────────────────────
  const [attempts, setAttempts] = useState<CandidateAssessmentAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<CandidateAssessmentAttempt | null>(null);
  const [isAttemptDropdownOpen, setIsAttemptDropdownOpen] = useState(false);

  // ── AI Interview Generation State ─────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // ── JSON Upload State ─────────────────────────────────────
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch Candidates ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCandidates(true);
    const timer = setTimeout(() => {
      fetchInterviewCandidates(candidateQuery)
        .then((res) => {
          if (isMounted && res?.candidates) setCandidates(res.candidates);
        })
        .catch((err) => console.error('Error fetching candidates:', err))
        .finally(() => { if (isMounted) setIsLoadingCandidates(false); });
    }, 300);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [candidateQuery]);

  // ── Fetch Attempts when Candidate Selected ────────────────
  useEffect(() => {
    if (!selectedCandidate) {
      setAttempts([]);
      setSelectedAttempt(null);
      return;
    }
    let isMounted = true;
    setIsLoadingAttempts(true);
    fetchCandidateAssessments(selectedCandidate.id)
      .then((res) => {
        if (isMounted && res?.assessments) {
          setAttempts(res.assessments);
          if (res.assessments.length > 0) setSelectedAttempt(res.assessments[0]);
        }
      })
      .catch((err) => console.error('Error fetching assessment attempts:', err))
      .finally(() => { if (isMounted) setIsLoadingAttempts(false); });
    return () => { isMounted = false; };
  }, [selectedCandidate]);

  // ── Generate & Launch (Database Mode) ────────────────────
  const handleGenerateAndLaunch = async () => {
    if (!selectedCandidate || !selectedAttempt) {
      setGenerationError('Please select both a Candidate and an Assessment Attempt.');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const ingestRes = await client.post<{ context_id: string }>('/api/evaluator/ingest_phase2', {
        submission_id: selectedAttempt.attempt_id
      }, { timeout: 300000 }).catch(() => null);

      if (ingestRes?.context_id) {
        const startRes = await startInterview(ingestRes.context_id);
        router.push(`/evaluator/interview?id=${startRes.thread_id || ingestRes.context_id}`);
      } else {
        const res = await generateAIInterview(selectedCandidate.id, selectedAttempt.attempt_id);
        if (res?.interview_id) {
          router.push(`/evaluator/interview?id=${res.interview_id}`);
        } else {
          throw new Error('Failed to receive valid interview ID from backend.');
        }
      }
    } catch (err: any) {
      setGenerationError(err?.message || 'Failed to generate AI interview. Please try again.');
      setIsGenerating(false);
    }
  };

  // ── JSON Upload Mode Handlers ─────────────────────────────
  const [rawFile, setRawFile] = useState<File | null>(null);

  const handleFileSelect = async (file: File) => {
    setRawFile(file);
    setUploadedFile({ name: file.name, size: file.size });
    setUploadError(null);
  };

  const handleLaunchFromUpload = async () => {
    if (!rawFile) {
      setUploadError('Please upload a JSON file first.');
      return;
    }
    setIsStarting(true);
    setUploadError(null);
    try {
      const text = await rawFile.text();
      const payload = JSON.parse(text);
      const res = await uploadJsonPayload(payload);
      if (res?.context_id) {
        const startRes = await startInterview(res.context_id);
        router.push(`/evaluator/interview?id=${startRes.thread_id || res.context_id}`);
      } else {
        router.push(`/evaluator/interview`);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse JSON file. Please ensure it is a valid JSON document.');
      setIsStarting(false);
    }
  };

  const canLaunchDatabase = selectedCandidate && selectedAttempt && !isGenerating;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full min-h-screen">
      <div className="w-full max-w-[700px] flex flex-col items-center text-center my-8">
        {/* Eyebrow */}
        <span className="font-mono text-accent text-sm tracking-widest uppercase mb-3">
          Step 01 — Assessment Ingestion
        </span>

        {/* Title */}
        <h1 className="font-serif text-4xl sm:text-5xl text-surface mb-3">
          Drop in your assessment.
        </h1>
        <p className="text-muted mb-8 text-lg max-w-[500px] leading-relaxed">
          Choose a candidate from the database or upload a completed assessment JSON to begin the evidence-driven AI interview.
        </p>

        {/* Mode Switcher */}
        <div className="flex bg-surface/10 rounded-full p-1 mb-8 w-full max-w-sm">
          <button
            onClick={() => { setInputMode('database'); setGenerationError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none",
              inputMode === 'database'
                ? "bg-surface text-background shadow-md"
                : "text-surface/70 hover:text-surface"
            )}
          >
            <UserCheck className="w-4 h-4" />
            Candidate Select
          </button>
          <button
            onClick={() => { setInputMode('upload'); setGenerationError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none",
              inputMode === 'upload'
                ? "bg-surface text-background shadow-md"
                : "text-surface/70 hover:text-surface"
            )}
          >
            <UploadCloud className="w-4 h-4" />
            JSON Upload
          </button>
        </div>

        {/* ─────────────────────────────────────────────────── */}
        {/* DATABASE MODE                                        */}
        {/* ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {inputMode === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full flex flex-col items-center gap-5"
            >
              {/* Step 1: Select Candidate */}
              <div className="w-full max-w-[560px] flex flex-col items-start gap-2">
                <label className="font-mono text-xs text-muted uppercase tracking-wider">
                  Candidate Name
                </label>
                <div className="relative w-full" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCandidateDropdownOpen(!isCandidateDropdownOpen);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border bg-surface/5 text-left transition-all",
                      isCandidateDropdownOpen
                        ? "border-accent shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
                        : "border-surface/20 hover:border-surface/40"
                    )}
                  >
                    <span className={cn("text-sm font-medium", selectedCandidate ? "text-surface" : "text-muted")}>
                      {selectedCandidate
                        ? `${selectedCandidate.name} — ${selectedCandidate.email || selectedCandidate.id}`
                        : isLoadingCandidates
                          ? 'Loading candidates...'
                          : '— Select candidate —'}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted transition-transform duration-200",
                        isCandidateDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isCandidateDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-surface/20 bg-background shadow-2xl overflow-hidden"
                      >
                        {/* Search */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface/10">
                          <Search className="w-4 h-4 text-muted shrink-0" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by name or ID..."
                            value={candidateQuery}
                            onChange={(e) => setCandidateQuery(e.target.value)}
                            className="w-full bg-transparent text-sm text-surface placeholder:text-muted focus:outline-none"
                          />
                          {candidateQuery && (
                            <button onClick={() => setCandidateQuery('')} className="text-muted hover:text-surface">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Candidate List */}
                        <div className="max-h-56 overflow-y-auto">
                          {isLoadingCandidates ? (
                            <div className="flex items-center justify-center gap-2 p-6 text-muted text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                            </div>
                          ) : candidates.length === 0 ? (
                            <div className="p-6 text-center text-muted text-sm">
                              No candidates found.
                            </div>
                          ) : (
                            candidates.map((cand) => {
                              const isSelected = selectedCandidate?.id === cand.id;
                              return (
                                <button
                                  key={cand.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCandidate(cand);
                                    setIsCandidateDropdownOpen(false);
                                    setCandidateQuery('');
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                                    isSelected
                                      ? "bg-accent/10 text-accent"
                                      : "text-surface/80 hover:bg-surface/5"
                                  )}
                                >
                                  <div>
                                    <p className="font-medium">{cand.name}</p>
                                    <p className="text-xs text-muted font-mono">{cand.email || cand.id}</p>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Step 2: Select Assessment Attempt */}
              {selectedCandidate && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[560px] flex flex-col items-start gap-2"
                >
                  <label className="font-mono text-xs text-muted uppercase tracking-wider">
                    Test Attended
                  </label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setIsAttemptDropdownOpen(!isAttemptDropdownOpen)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border bg-surface/5 text-left transition-all",
                        isAttemptDropdownOpen
                          ? "border-accent shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
                          : "border-surface/20 hover:border-surface/40"
                      )}
                    >
                      <span className={cn("text-sm font-medium", selectedAttempt ? "text-surface" : "text-muted")}>
                        {isLoadingAttempts
                          ? 'Loading assessments...'
                          : selectedAttempt
                            ? `${selectedAttempt.assessment_name || selectedAttempt.attempt_id} — ${new Date(selectedAttempt.assessment_date || Date.now()).toLocaleDateString()}`
                            : '— Select test attended —'}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted transition-transform duration-200",
                          isAttemptDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {isAttemptDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-surface/20 bg-background shadow-2xl overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto">
                            {isLoadingAttempts ? (
                              <div className="flex items-center justify-center gap-2 p-6 text-muted text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading assessments...
                              </div>
                            ) : attempts.length === 0 ? (
                              <div className="p-6 text-center text-muted text-sm">
                                No assessment attempts found for this candidate.
                              </div>
                            ) : (
                              attempts.map((att) => {
                                const isSelected = selectedAttempt?.attempt_id === att.attempt_id;
                                return (
                                  <button
                                    key={att.attempt_id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAttempt(att);
                                      setIsAttemptDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                                      isSelected
                                        ? "bg-accent/10 text-accent"
                                        : "text-surface/80 hover:bg-surface/5"
                                    )}
                                  >
                                    <div>
                                      <p className="font-medium">{att.assessment_name || att.attempt_id}</p>
                                      <p className="text-xs text-muted font-mono">
                                        Score: {att.percentage ?? '—'}% &nbsp;·&nbsp;{' '}
                                        {att.assessment_date
                                          ? new Date(att.assessment_date).toLocaleDateString(undefined, {
                                              year: 'numeric', month: 'short', day: 'numeric'
                                            })
                                          : 'Unknown date'}
                                      </p>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Summary chip when both selected */}
              {selectedCandidate && selectedAttempt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-[560px] flex items-center gap-3 p-4 rounded-xl border border-accent/30 bg-accent/5"
                >
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-sm text-surface/90 text-left">
                    <span className="font-semibold">{selectedCandidate.name}</span>
                    {' — '}
                    <span className="text-muted font-mono text-xs">
                      {selectedAttempt.assessment_name || selectedAttempt.attempt_id}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-mono border border-success/20">
                      {selectedAttempt.percentage ?? '—'}%
                    </span>
                  </p>
                </motion.div>
              )}

              {generationError && (
                <div className="w-full max-w-[560px] flex items-start gap-2 p-3.5 rounded-xl border border-error/30 bg-error/5 text-error text-xs font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </div>
              )}

              <button
                onClick={handleGenerateAndLaunch}
                disabled={!canLaunchDatabase}
                className={cn(
                  "mt-4 px-8 py-3 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background flex items-center gap-2",
                  canLaunchDatabase
                    ? "bg-accent text-background hover:bg-accent/90 cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "bg-surface/20 text-surface/40 cursor-not-allowed opacity-40"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Interview...
                  </>
                ) : (
                  <>
                    Generate & Start Interview
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────── */}
          {/* JSON UPLOAD MODE                                     */}
          {/* ─────────────────────────────────────────────────── */}
          {inputMode === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full flex flex-col items-center gap-5"
            >
              <FileDropzone
                uploadedFile={uploadedFile}
                onFileSelect={handleFileSelect}
                onError={(msg) => setUploadError(msg)}
                accept=".json,application/json"
                maxSizeMB={10}
              />

              {uploadError && (
                <p className="text-error text-sm font-medium">{uploadError}</p>
              )}

              <button
                onClick={handleLaunchFromUpload}
                disabled={!uploadedFile || isStarting}
                className={cn(
                  "mt-2 px-8 py-3 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background flex items-center gap-2",
                  uploadedFile && !isStarting
                    ? "bg-accent text-background hover:bg-accent/90 cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "bg-surface/20 text-surface/40 cursor-not-allowed opacity-40"
                )}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    Start Interview
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
