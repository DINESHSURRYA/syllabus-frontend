"use client";
import './styles/page.css';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GitFork,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileText,
  X,
  Layers,
  Play,
  BookOpen,
  UserCheck,
  Search,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluatorStore } from '@/stores';
import {
  uploadContextFile,
  startInterview,
  fetchAttendedCandidates,
  fetchAttendedAssessmentSnapshot,
  uploadJsonPayload,
  AttendedCandidate,
} from '@/lib/evaluator-api';
import { EvaluatorActionFooter, EvaluatorEmptyState } from '@/components/ui/evaluator';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Step = 'upload' | 'start';

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AssessmentUploadPage() {
  const router = useRouter();
  const {
    contextId,
    uploadedFileName,
    uploadedFileUrl,
    setContextId,
    clearUpload,
    setPendingFile,
    setActiveSessionFromApi,
    setSelectedCandidateAssessment,
  } = useEvaluatorStore();

  // Derive current step from store state
  const [step, setStep] = useState<Step>(contextId ? 'start' : 'upload');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Attended candidates search select state
  const [attendedCandidates, setAttendedCandidates] = useState<AttendedCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<AttendedCandidate | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch Attended Candidates on load ────────────────────
  React.useEffect(() => {
    let isMounted = true;
    setIsLoadingCandidates(true);
    fetchAttendedCandidates()
      .then((res) => {
        if (isMounted && res?.candidates) {
          setAttendedCandidates(res.candidates);
        }
      })
      .catch((err) => {
        console.error('Error fetching attended candidates:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCandidates(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCandidates = attendedCandidates.filter((cand) => {
    const q = candidateSearchQuery.toLowerCase();
    return (
      cand.candidate_name.toLowerCase().includes(q) ||
      cand.assessment_code.toLowerCase().includes(q) ||
      cand.assessment_name.toLowerCase().includes(q) ||
      cand.submitted_at.toLowerCase().includes(q)
    );
  });

  // ── Generate from selected candidate ─────────────────────
  const handleGenerateFromCandidate = async () => {
    if (!selectedCandidate) {
      setUploadError('Please select a candidate assessment from the dropdown first.');
      return;
    }

    setIsGenerating(true);
    setUploadError(null);

    try {
      // 1. Fetch Snapshot JSON from PostgreSQL
      const snapshot = await fetchAttendedAssessmentSnapshot(
        selectedCandidate.candidate_id,
        selectedCandidate.assessment_code
      );

      // 2. Extract weak topics (questions with is_user_correct === false or unanswered)
      const rawTopics = snapshot?.topics || [];
      const weakTopicsSet = new Set<string>();

      rawTopics.forEach((t: any) => {
        const hasWeak = t.questions?.some((q: any) => q.is_user_correct === false || q.is_user_correct === null);
        if (hasWeak || (t.no_of_crt_ans < t.no_of_questions)) {
          weakTopicsSet.add(t.topic);
        }
      });

      const weakTopics = Array.from(weakTopicsSet);

      // Save candidate assessment context into store
      setSelectedCandidateAssessment({
        candidate_id: selectedCandidate.candidate_id,
        candidate_name: selectedCandidate.candidate_name,
        assessment_code: selectedCandidate.assessment_code,
        assessment_name: selectedCandidate.assessment_name,
        submitted_at: selectedCandidate.submitted_at,
        set_id: selectedCandidate.set_id,
        score_percentage: selectedCandidate.score_percentage,
        weak_topics: weakTopics.length > 0 ? weakTopics : ['Binary Search Trees', 'Dynamic Programming'],
        total_questions: snapshot?.performance?.total_questions || snapshot?.questions?.length || 6,
        attended_questions: snapshot?.performance?.attended_questions || 6,
        raw_snapshot: snapshot,
      });

      // 3. Post payload to evaluator ingest
      const uploadRes = await uploadJsonPayload(snapshot);
      setContextId(uploadRes.context_id);

      // 4. Start Interview Session
      const startRes = await startInterview(uploadRes.context_id);
      setActiveSessionFromApi(startRes);

      // 5. Navigate to /evaluator/interview
      router.push('/evaluator/interview');
    } catch (err: any) {
      console.error('Error generating from candidate:', err);
      setUploadError(err?.message || 'Failed to hydrate candidate assessment data. Please try again.');
      setIsGenerating(false);
    }
  };

  // ── Drag & Drop ──────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) acceptFile(e.dataTransfer.files[0]);
  };

  const acceptFile = (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json' && ext !== 'csv') {
      setUploadError('Invalid file type. Please upload a .json or .csv assessment file.');
      return;
    }
    setSelectedFile(file);
    setPendingFile(file.name);
  };

  const clearFile = () => {
    setSelectedFile(null);
    clearUpload();
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Step 1: Upload file ───────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a JSON or CSV file before uploading.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadContextFile(selectedFile);
      setContextId(res.context_id);
      setStep('start');
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed. Check that the evaluator server is running.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Step 2: Start interview ───────────────────────────────
  const handleStartInterview = async () => {
    if (!contextId) return;

    setIsStarting(true);
    setUploadError(null);

    try {
      const res = await startInterview(contextId);
      setActiveSessionFromApi(res);
      router.push('/evaluator/interview');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to start the interview. Please try again.');
      setIsStarting(false);
    }
  };

  // ── Reset to upload step ──────────────────────────────────
  const handleReset = () => {
    clearUpload();
    clearFile();
    setUploadError(null);
    setStep('upload');
  };

  return (
    <div className="space-y-8 pb-16">

      {/* ── Back Navigation ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all shadow-sm group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* ── Step Indicator ────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {(['upload', 'start'] as Step[]).map((s, i) => {
          const isActive = step === s;
          const isDone = (s === 'upload' && step === 'start');
          const labels: Record<Step, string> = {
            upload: 'Upload File',
            start: 'Start Interview',
          };
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <div className={`h-px flex-1 transition-colors duration-500 ${isDone || isActive ? 'bg-indigo-500' : 'bg-[var(--border-subtle)]'}`} />
              )}
              <div className={`flex items-center gap-2 text-xs font-mono font-bold transition-colors ${isActive ? 'text-indigo-300' : isDone ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${isActive ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : isDone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="hidden sm:block">{labels[s]}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1.5">
            <GitFork size={14} />
            <span>{step === 'upload' ? 'Step 01 — Context Ingestion' : 'Step 02 — Session Initialization'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight">
            {step === 'upload' ? 'Upload Assessment File' : 'Start Interview Session'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            {step === 'upload'
              ? 'Upload your JSON or CSV assessment file. The evaluator server will extract the topic structure and prepare a diagnostic context.'
              : 'Your file has been processed. Review the context details below, then launch the AI diagnostic interview.'}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ─────────── STEP 1: Upload ─────────── */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* ── Candidate & Assessment Dynamic Dropdown Selector Card ── */}
            <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 to-indigo-950/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Select Attended Candidate &amp; Assessment
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      Select a completed assessment submission to auto-hydrate performance metrics &amp; weak topics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative space-y-2">
                <label className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider block">
                  Attended Candidate / Assessment Code Dropdown
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-left hover:border-indigo-500/50 transition-all text-xs font-mono text-[var(--text-primary)]"
                  >
                    {selectedCandidate ? (
                      <div className="flex items-center justify-between flex-1 pr-3">
                        <span className="font-bold text-indigo-300">
                          {selectedCandidate.candidate_name} — {selectedCandidate.assessment_code} ({selectedCandidate.assessment_name}) — {new Date(selectedCandidate.submitted_at).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          Score: {selectedCandidate.score_percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">
                        {isLoadingCandidates ? 'Loading attended candidates…' : '-- Search or Select Candidate (e.g. PRATHABAN - CP4391 - 2026-07-29) --'}
                      </span>
                    )}
                    <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-indigo-500/40 bg-slate-900 shadow-2xl overflow-hidden p-2 space-y-2 max-h-72 flex flex-col">
                      {/* Search filter input inside dropdown */}
                      <div className="relative flex items-center px-3 py-2 bg-slate-950 rounded-lg border border-slate-800">
                        <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search candidate name or code (e.g. PRATHABAN, CP4391)..."
                          value={candidateSearchQuery}
                          onChange={(e) => setCandidateSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                          autoFocus
                        />
                        {candidateSearchQuery && (
                          <button onClick={() => setCandidateSearchQuery('')} className="text-slate-400 hover:text-white">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto space-y-1 flex-1">
                        {filteredCandidates.length === 0 ? (
                          <div className="p-4 text-center text-xs font-mono text-slate-400">
                            No matching attended candidates found
                          </div>
                        ) : (
                          filteredCandidates.map((cand) => {
                            const isSel = selectedCandidate?.candidate_id === cand.candidate_id;
                            const formattedDate = new Date(cand.submitted_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                            return (
                              <button
                                key={cand.candidate_id}
                                type="button"
                                onClick={() => {
                                  setSelectedCandidate(cand);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-mono transition-colors ${
                                  isSel ? 'bg-indigo-600/30 border border-indigo-500/50 text-white' : 'hover:bg-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold flex items-center gap-2">
                                    <span className="text-indigo-300">{cand.candidate_name}</span>
                                    <span className="text-slate-400 font-normal">•</span>
                                    <span className="text-cyan-300 font-bold">{cand.assessment_code}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {cand.assessment_name} &nbsp;•&nbsp; {formattedDate}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {cand.score_percentage}%
                                  </span>
                                  {isSel && <Check size={14} className="text-emerald-400" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate button for selected candidate */}
              {selectedCandidate && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>Candidate Selected: {selectedCandidate.candidate_name} ({selectedCandidate.assessment_code})</span>
                    </p>
                    <p className="text-[11px] font-mono text-indigo-200">
                      Click Generate to hydrate PostgreSQL snapshot &amp; launch diagnostic interview.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateFromCandidate}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-50 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Generating…</span>
                      </>
                    ) : (
                      <>
                        <span>Generate &amp; Launch Interview</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* File Dropzone */}
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-indigo-500/50 hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-5">
                    <UploadCloud size={30} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
                    Drag &amp; drop your assessment file
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] text-center max-w-sm">
                    Upload a JSON or CSV file containing questions, topics, and concept structure.
                    Up to 15 MB.
                  </p>
                  <div className="flex items-center gap-3 mt-6">
                    <span className="px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">.JSON</span>
                    <span className="px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">.CSV</span>
                  </div>
                </div>
              ) : (
                /* Selected file preview */
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{selectedFile.name}</p>
                      <p className="text-xs font-mono text-[var(--text-muted)]">
                        {fileSizeLabel(selectedFile.size)} &nbsp;·&nbsp; Ready to upload
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <button
                      onClick={clearFile}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {uploadError && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Empty state */}
            {!selectedFile && (
              <EvaluatorEmptyState
                icon={BookOpen}
                title="No file selected"
                description="Upload a JSON or CSV file containing your assessment topics and questions. The evaluator server will parse the structure and create a diagnostic context."
              />
            )}

            {/* CTA */}
            <EvaluatorActionFooter
              leftContent={
                <>
                  <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                    selectedFile
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}>
                    <Cpu size={20} className={isUploading ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {selectedFile ? `Ready to upload ${selectedFile.name}` : 'Select a file to continue'}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      {selectedFile ? `${fileSizeLabel(selectedFile.size)} — JSON/CSV assessment` : 'Supports .json and .csv formats'}
                    </p>
                  </div>
                </>
              }
              rightContent={
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <span>Upload File</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              }
            />
          </motion.div>
        )}

        {/* ─────────── STEP 2: Start Interview ─────────── */}
        {step === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Upload success card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">File Uploaded</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{uploadedFileName}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 flex items-center gap-3">
                <Layers size={20} className="text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Context ID</p>
                  <p className="text-xs font-mono text-[var(--text-primary)] truncate">{contextId}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex items-center gap-3">
                <GitFork size={20} className="text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-0.5">Status</p>
                  <p className="text-sm font-bold text-emerald-300">Ready to start</p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">What happens next?</h3>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-mono">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">01</span>
                  The evaluator server will load your assessment context and initialize a LangGraph session thread.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">02</span>
                  The AI will generate the first diagnostic question tailored to your uploaded topics.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">03</span>
                  You&apos;ll be taken to the interview screen to answer questions and receive real-time evaluations.
                </li>
              </ul>
            </div>

            {/* Error */}
            {uploadError && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* CTA */}
            <EvaluatorActionFooter
              leftContent={
                <>
                  <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 bg-indigo-500/20 border-indigo-500/40 text-indigo-300`}>
                    <Play size={20} className={isStarting ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Ready to launch</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      Context: <span className="text-indigo-300 font-bold">{contextId?.slice(0, 16)}…</span>
                    </p>
                  </div>
                </>
              }
              rightContent={
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleReset}
                    disabled={isStarting}
                    className="px-4 py-3 rounded-xl font-bold text-xs border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all disabled:opacity-40"
                  >
                    Upload different file
                  </button>
                  <button
                    onClick={handleStartInterview}
                    disabled={isStarting}
                    className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Starting Session…</span>
                      </>
                    ) : (
                      <>
                        <span>Start Interview</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Processing Overlay ────────────────────────────── */}
      <AnimatePresence>
        {(isUploading || isStarting) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center p-8 rounded-3xl border border-indigo-500/40 bg-slate-900 shadow-2xl text-center space-y-5 max-w-sm mx-4"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                <GitFork size={22} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  {isUploading ? 'Uploading to Evaluator Server' : 'Initializing Interview Session'}
                </h3>
                <p className="text-xs text-indigo-300 font-mono leading-relaxed">
                  {isUploading
                    ? <>Processing <span className="font-bold text-white">{selectedFile?.name}</span>…</>
                    : <>Starting LangGraph thread for context <span className="font-bold text-white">{contextId?.slice(0, 12)}…</span></>}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
