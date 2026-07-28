"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileText, Loader2, Sparkles, Cpu, AlertTriangle, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadZone } from '@/components/upload-zone';
import { checkCourseCodeExists } from '@/lib/api-client';
import { useSyllabusStore, emptySyllabus } from '@/lib/store';
import { useGuideStore } from '@/lib/guide-store';
import { useGlobalLoading } from '@/components/providers/loading-provider';

export default function UploadPage() {
  const router = useRouter();
  const { startProcessing, stopProcessing, triggerLoading } = useGlobalLoading();
  const [courseCode, setCourseCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [courseCodeStatus, setCourseCodeStatus] = useState<'idle' | 'approved' | 'duplicate'>('idle');
  const [courseCodeError, setCourseCodeError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const {
    setExtractedText,
    updateCourseDetails,
    setJobId,
    setBackgroundProcessing,
    setSyllabus,
    setPendingExtraction,
    setExtractionProgress,
  } = useSyllabusStore();
  const { highlightedTargetId, setDuplicateDetectedCode, setWorkflowStep } = useGuideStore();

  const handleCourseCodeValidation = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCourseCodeStatus('idle');
      setCourseCodeError(null);
      setDuplicateDetectedCode(null);
      return;
    }

    setIsCheckingCode(true);
    setCourseCodeError(null);

    try {
      const res = await checkCourseCodeExists(trimmed);
      if (res.exists) {
        setCourseCodeStatus('duplicate');
        setDuplicateDetectedCode(trimmed.toUpperCase());
        setCourseCodeError(
          "This syllabus is already in the syllabus repository. To upload an existing syllabus, you must delete the existing one first."
        );
      } else {
        setCourseCodeStatus('approved');
        setCourseCodeError(null);
        setDuplicateDetectedCode(null);
        setWorkflowStep('upload_file');
        updateCourseDetails({ code: trimmed.toUpperCase() });
      }
    } catch (err) {
      console.warn("Course code verification error:", err);
      setCourseCodeStatus('approved');
      setWorkflowStep('upload_file');
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (courseCodeStatus !== 'approved' || !courseCode.trim()) return;

    // Reset previous stored syllabus draft so old uploads don't persist into new session
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('active_saved_syllabus');
      } catch (e) {}
    }
    useSyllabusStore.getState().setSyllabus(emptySyllabus);

    const codeClean = courseCode.trim().toUpperCase();
    updateCourseDetails({ code: codeClean });
    setSelectedFile(file);

    // Save pending upload & initiate progress bar state for Verification Page
    setPendingExtraction({ file, courseCode: codeClean });
    setExtractionProgress({
      isExtracting: true,
      step: 1,
      progress: 20,
      statusText: 'Validating Course Code...',
      error: null,
    });

    // Immediately route to Verification Page
    router.push('/verification');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-slate-200/90 dark:border-cyan-500/25 bg-white dark:bg-black/70 p-8 backdrop-blur-2xl shadow-lg dark:shadow-[0_0_40px_rgba(6,182,212,0.1)]"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-cyan-500/30 bg-indigo-50 dark:bg-cyan-500/10 px-3.5 py-1 text-xs font-mono text-indigo-700 dark:text-cyan-300 font-semibold">
                <Sparkles size={14} /> Stage 1: Document Upload &bull; Stage 2: AI Parsing
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Upload &amp; Extract Syllabus</h1>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300 text-sm">
                Enter your course code for database pre-validation. Once approved, upload your syllabus document to automatically begin processing and route to Verification.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/60 px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">
              PDF, DOCX, JSON, PNG, JPG supported
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">

            {/* Step 1: Pre-Upload Validation (Course Code Check) */}
            <Card
              id="guide-course-code-input"
              className={`border-slate-200/90 dark:border-white/10 bg-white dark:bg-black/70 backdrop-blur-2xl shadow-md transition-all ${
                highlightedTargetId === 'guide-course-code-input'
                  ? 'ring-4 ring-cyan-500/70 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse'
                  : 'dark:shadow-[0_0_30px_rgba(0,0,0,0.8)]'
              }`}
            >
              <CardHeader className="p-6 border-b border-slate-200/90 dark:border-white/10">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                    Step 1: Course Code Pre-Validation
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    REQUIRED
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label htmlFor="courseCodeInput" className="block text-xs font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Course Code (e.g. CS3451, EC8551, GE3151)
                  </label>
                  <div className="relative">
                    <input
                      id="courseCodeInput"
                      type="text"
                      value={courseCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCourseCode(val);
                        handleCourseCodeValidation(val);
                      }}
                      onBlur={() => handleCourseCodeValidation(courseCode)}
                      placeholder="Enter Course Code..."
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-mono font-semibold uppercase outline-none transition-all ${
                        courseCodeStatus === 'duplicate'
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300 focus:ring-2 focus:ring-red-500'
                          : courseCodeStatus === 'approved'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/50 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                      }`}
                    />
                    {isCheckingCode && (
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-xs font-mono text-cyan-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Checking DB...
                      </div>
                    )}
                  </div>
                </div>

                {/* Database Validation Result Feedback */}
                <AnimatePresence mode="wait">
                  {courseCodeStatus === 'duplicate' && courseCodeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-700 dark:text-red-300 flex items-start gap-3 backdrop-blur-sm"
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                      <div className="text-xs leading-relaxed font-semibold">
                        <p className="font-bold text-red-800 dark:text-red-200">Syllabus Already Exists in Database</p>
                        <p className="mt-1">{courseCodeError}</p>
                      </div>
                    </motion.div>
                  )}

                  {courseCodeStatus === 'approved' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 font-mono text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Course Code &quot;{courseCode.trim().toUpperCase()}&quot; Verified &amp; Approved for Upload
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Step 2: Simplified Browse Document Uploader */}
            <Card
              id="guide-upload-zone"
              className={`border-slate-200/90 dark:border-white/10 bg-white dark:bg-black/70 backdrop-blur-2xl p-0 shadow-md transition-all ${
                highlightedTargetId === 'guide-upload-zone'
                  ? 'ring-4 ring-emerald-500/70 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse'
                  : 'dark:shadow-[0_0_30px_rgba(0,0,0,0.8)]'
              }`}
            >
              <CardHeader className="p-6 border-b border-slate-200/90 dark:border-white/10">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                    Step 2: Browse &amp; Auto-Process Syllabus Document
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <UploadZone
                  file={selectedFile}
                  isUploading={isExtracting}
                  disabled={courseCodeStatus !== 'approved'}
                  onFileSelect={handleFileUpload}
                  onRemove={() => setSelectedFile(null)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Syllabus AI Pipeline Overview */}
          <Card className="border-slate-200/90 dark:border-white/10 bg-white dark:bg-black/70 backdrop-blur-2xl shadow-md dark:shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <CardHeader className="p-6 border-b border-slate-200/90 dark:border-white/10">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Syllabus AI Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {[
                { title: 'Course Code Pre-Validation', desc: 'Checks database for duplicates prior to upload' },
                { title: 'Single-Step Document Select', desc: 'Browse syllabus file to automatically initiate parsing' },
                { title: 'AI Extraction & LLM Parsing', desc: 'Extracts course structure, units, topics & learning hours' },
                { title: 'Verification Editor Redirect', desc: 'Immediate routing to Verification Page for instant review' },
                { title: 'Database Persistence', desc: 'Dual save actions to commit verified syllabus data' }
              ].map((step, index) => (
                <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 p-3">
                  <div className="rounded-full bg-indigo-50 dark:bg-cyan-500/15 p-2 text-indigo-700 dark:text-cyan-300 font-mono text-xs font-bold border border-indigo-200 dark:border-cyan-500/30">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/60 p-4">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-cyan-300 font-semibold">
                  <FileText size={16} className="text-indigo-600 dark:text-cyan-400" />
                  Streamlined Single-Step Workflow
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter a unique course code to unlock document browsing. Once selected, your document is processed automatically and transferred directly to the Verification Editor.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
