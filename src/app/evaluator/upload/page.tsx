"use client";

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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluatorStore } from '@/lib/evaluator-store';
import { uploadContextFile, startInterview } from '@/lib/evaluator-api';
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
  } = useEvaluatorStore();

  // Derive current step from store state
  const [step, setStep] = useState<Step>(contextId ? 'start' : 'upload');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPendingFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPendingFile(null);
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
      setContextId(res.context_id, res.filename, res.url);
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
