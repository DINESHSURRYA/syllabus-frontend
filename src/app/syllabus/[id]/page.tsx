"use client";
import './styles/page.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  ArrowLeft,
  Building2,
  GraduationCap,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit3,
  GitBranch,
  Trash2,
  Archive,
  GitCompare,
  RotateCcw,
  BookOpen,
  FileText,
  Bookmark,
  Layers,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ListChecks,
  Sparkles,
  Info,
  ShieldCheck,
  Grid3X3
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  updateSyllabusRepository,
  deleteSyllabusRepository,
  getSyllabusVersions,
  restoreSyllabusVersion,
  deleteSyllabusVersion,
  verifySyllabusRepository,
  getSyllabusDownloadUrl
} from '@/lib/api-client';
import { VersionCompareModal } from '@/components/syllabus/version-compare-modal';
import { CoPoMappingModal } from '@/components/syllabus/copo-mapping-modal';
import { useSyllabusStore, emptySyllabus } from '@/stores';
import { syllabusApi } from '@/lib/api';

export default function SyllabusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const syllabusId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCoPoOpen, setIsCoPoOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch Syllabus Details & Version History
  const loadSyllabus = async () => {
    setLoading(true);
    try {
      const data = await syllabusApi.getSyllabus(syllabusId);
      setSyllabusData(data);

      // Fetch versions
      try {
        const vRes = await getSyllabusVersions(syllabusId);
        setVersions(vRes.versions || []);
      } catch (ve) {
        console.warn("Could not fetch version history:", ve);
      }
    } catch (err) {
      console.error("Error loading syllabus detail:", err);
      showToast("Error loading syllabus details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (syllabusId) {
      loadSyllabus();
    }
  }, [syllabusId]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const content = syllabusData?.content || syllabusData || {};
  const courseCode = syllabusData?.courseCode || content.metadata?.courseCode || content.course?.code || 'COURSE';
  const courseName = syllabusData?.courseName || content.metadata?.courseName || content.course?.title || 'Untitled Syllabus';

  const handleVerify = async () => {
    try {
      await verifySyllabusRepository(syllabusId);
      // Redirect back to syllabus repository page with success query param for celebration modal
      router.push(`/syllabus?verified=true&id=${encodeURIComponent(syllabusId)}&code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(courseName)}`);
    } catch (err) {
      showToast("Failed to verify syllabus.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSyllabusRepository(syllabusId);
      showToast("Syllabus deleted.", "success");

      const activeStoreSyllabus = useSyllabusStore.getState().syllabus;
      if (activeStoreSyllabus && (activeStoreSyllabus.id === syllabusId || activeStoreSyllabus.course?.code?.toLowerCase() === syllabusId.toLowerCase())) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('active_saved_syllabus');
        }
        useSyllabusStore.setState({ syllabus: emptySyllabus });
      }

      router.push('/syllabus');
    } catch (err) {
      showToast("Failed to delete syllabus.", "error");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteVersion = async (vNum: number) => {
    try {
      await deleteSyllabusVersion(syllabusId, vNum);
      showToast(`Version ${vNum} deleted successfully.`, "success");
      setIsCompareOpen(false);
      loadSyllabus();
    } catch (err) {
      showToast("Failed to delete version.", "error");
    }
  };

  const handleArchive = async () => {
    try {
      await deleteSyllabusRepository(syllabusId, true);
      showToast("Archive status updated.", "success");
      loadSyllabus();
    } catch (err) {
      showToast("Failed to archive syllabus.", "error");
    }
  };

  const handleRestoreVersion = async (vNum: number) => {
    try {
      await restoreSyllabusVersion(syllabusId, vNum);
      showToast(`Restored version ${vNum} as active version.`, "success");
      loadSyllabus();
    } catch (err) {
      showToast("Failed to restore version.", "error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-500 dark:text-slate-400">Loading extracted syllabus details...</p>
        </div>
      </AppShell>
    );
  }

  if (!syllabusData) {
    return (
      <AppShell>
        <div className="p-12 text-center space-y-4">
          <AlertCircle size={36} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Syllabus Not Found</h2>
          <Button onClick={() => router.push('/syllabus')} variant="outline">
            Back to Repository
          </Button>
        </div>
      </AppShell>
    );
  }

  // Normalize structure
  const university = syllabusData.university || content.metadata?.university || 'Standard University';
  const regulation = syllabusData.regulation || content.metadata?.regulation || 'R2021';
  const department = syllabusData.department || content.metadata?.department || 'Computer Science & Engineering';
  const semester = syllabusData.semester || content.metadata?.semester || 'Semester V';
  const academicYear = syllabusData.academicYear || content.metadata?.academicYear || '2023-2024';
  const credits = syllabusData.credits || content.metadata?.credits || 4;
  const versionNum = syllabusData.versionNumber || content.versionNumber || 1;

  const rawUnits = (content.units && content.units.length > 0)
    ? content.units
    : (syllabusData?.units && syllabusData.units.length > 0)
      ? syllabusData.units
      : (content.hierarchicalTreeData?.units || syllabusData?.hierarchicalTreeData?.units || (Array.isArray(content.hierarchicalTreeData) ? content.hierarchicalTreeData : []));
  const units = Array.isArray(rawUnits) ? rawUnits : [];
  const objectives = content.objectives || syllabusData.objectives || [];
  const outcomes = content.outcomes || syllabusData.outcomes || [];
  const textbooks = content.textbooks || syllabusData.textbooks || [];
  const references = content.references || content.reference_books || syllabusData.references || [];
  const labExperiments = content.labExperiments || content.experiments || syllabusData.labExperiments || [];

  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/90 border-red-500/40 text-red-300'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Link & Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/syllabus')}
            variant="ghost"
            className="text-slate-800 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300 font-mono text-xs font-semibold"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Syllabus Repository
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm font-semibold">
              Active Version: v{versionNum}
            </span>
            {versions.length > 1 && (
              <Button
                onClick={() => setIsCompareOpen(true)}
                variant="outline"
                size="sm"
                className="border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-mono font-bold"
              >
                <GitCompare size={14} className="mr-1.5" /> Compare Versions ({versions.length})
              </Button>
            )}
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="relative rounded-[32px] border border-slate-200 dark:border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-slate-900/95 dark:via-indigo-950/40 dark:to-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-sm hover:shadow-md transition-all space-y-6 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-indigo-100 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
                  {courseCode}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {regulation}
                </span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                  syllabusData.verificationStatus === 'Verified'
                    ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-amber-100 text-amber-950 dark:bg-amber-500/10 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                }`}>
                  {syllabusData.verificationStatus || 'Verified'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{courseName}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-800 dark:text-slate-400 font-semibold mt-3">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-indigo-600 dark:text-indigo-400" /> {university}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-indigo-600 dark:text-indigo-400" /> {department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" /> {semester} ({academicYear})
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => router.push(`/verification?id=${syllabusId}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
              >
                <Edit3 size={15} className="mr-1.5" /> Edit Syllabus
              </Button>

              <Button
                onClick={handleVerify}
                variant="outline"
                className="border-emerald-300 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-xs font-bold"
              >
                <CheckCircle2 size={15} className="mr-1.5 text-emerald-700 dark:text-emerald-500" /> Verify
              </Button>

              <Button
                onClick={() => router.push(`/curriculum?id=${syllabusId}`)}
                variant="outline"
                className="border-purple-300 dark:border-purple-500/40 bg-purple-100 dark:bg-purple-500/10 text-purple-950 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/20 text-xs font-bold"
              >
                <GitBranch size={15} className="mr-1.5" /> Curriculum Tree
              </Button>

              <Button
                onClick={() => setIsCoPoOpen(true)}
                variant="outline"
                className="border-indigo-300 dark:border-indigo-500/40 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-950 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 text-xs font-bold"
              >
                <Grid3X3 size={15} className="mr-1.5 text-indigo-600 dark:text-indigo-400" /> CO-PO Mapping
              </Button>

              {/* Download Dropdown / Exports */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm font-semibold">
                <a
                  href={getSyllabusDownloadUrl(syllabusId, 'json')}
                  download
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-indigo-300"
                  title="Download JSON"
                >
                  JSON
                </a>
                <a
                  href={getSyllabusDownloadUrl(syllabusId, 'markdown')}
                  download
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-indigo-300"
                  title="Download Markdown"
                >
                  MD
                </a>
                <a
                  href={getSyllabusDownloadUrl(syllabusId, 'pdf')}
                  download
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-indigo-300"
                  title="Download PDF"
                >
                  PDF
                </a>
              </div>

              <Button
                onClick={handleArchive}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400"
                title="Archive Syllabus"
              >
                <Archive size={16} />
              </Button>

              <Button
                onClick={handleDelete}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                title="Delete Syllabus"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 relative z-10">
            {/* CREDITS */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950 p-4 rounded-2xl border border-indigo-500/30 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-bold block uppercase tracking-wider">TOTAL CREDITS</span>
                <span className="text-base font-bold text-slate-900 dark:text-indigo-300">{credits} Credits</span>
              </div>
            </div>

            {/* UNITS */}
            <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-950 p-4 rounded-2xl border border-purple-500/30 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 font-bold block uppercase tracking-wider">TOTAL UNITS</span>
                <span className="text-base font-bold text-slate-900 dark:text-purple-300">{units.length} Modules</span>
              </div>
            </div>

            {/* EXTRACTION STATUS */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 p-4 rounded-2xl border border-emerald-500/30 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block uppercase tracking-wider">EXTRACTION STATUS</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{syllabusData.extractionStatus || 'Completed'}</span>
              </div>
            </div>

            {/* LAST MODIFIED */}
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950 p-4 rounded-2xl border border-amber-500/30 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold block uppercase tracking-wider">LAST MODIFIED</span>
                <span className="text-base font-bold text-slate-900 dark:text-amber-300">
                  {syllabusData.lastModified ? new Date(syllabusData.lastModified).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Breakdown Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Units & Topics Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="text-indigo-500" size={20} /> Extracted Units & Topics
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {units.length} Modules
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* ISOLATED SCROLLABLE PANE FOR EXTRACTED UNITS & TOPICS */}
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-sidebar-scrollbar p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-slate-50/80 dark:bg-slate-950/70 shadow-inner space-y-4 subpage-pane">
                  {units.map((unit: any, uIdx: number) => {
                    const isExpanded = expandedUnit === unit.id || expandedUnit === `u${uIdx + 1}` || expandedUnit === null;
                    const unitTitle = unit.title || `Unit ${uIdx + 1}`;
                    const unitHours = unit.learningHours || unit.hours || '';

                    return (
                      <div
                        key={uIdx}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:border-indigo-500/40 transition-all"
                      >
                        <button
                          onClick={() => setExpandedUnit(isExpanded ? '' : (unit.id || `u${uIdx + 1}`))}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/80 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold shadow-sm">
                              U{uIdx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{unitTitle}</h4>
                              {unitHours && <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{unitHours} Hours Allocation</p>}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white/60 dark:bg-slate-900/40">
                            {unit.topics?.map((t: any, tIdx: number) => {
                              const tTitle = typeof t === 'string' ? t : t.title || t.name || t.topicTitle || 'Topic';
                              const bloomLevel = typeof t === 'object' ? (t.bloomLevel || t.bloom_level || t.bloom) : null;
                              const subtopics = typeof t === 'object' ? (t.subtopics || []) : [];

                              return (
                                <div key={tIdx} className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 space-y-2 shadow-xs">
                                  {/* Topic Header */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                                      {tTitle}
                                    </span>
                                    {bloomLevel && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-500/20">
                                        {bloomLevel}
                                      </span>
                                    )}
                                  </div>

                                  {/* Subtopics */}
                                  {subtopics.length > 0 && (
                                    <div className="pl-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-800">
                                      {subtopics.map((st: any, stIdx: number) => (
                                        <p key={stIdx} className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                                          • {typeof st === 'string' ? st : st.title || st.name}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Practical & Lab Experiments */}
            {labExperiments.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-950/20">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FlaskConical className="text-purple-500" size={20} /> Practical & Lab Components
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2">
                  {labExperiments.map((exp: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 text-xs font-mono text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-purple-600 dark:text-purple-400">Exp {idx + 1}:</span>
                      <span>{typeof exp === 'string' ? exp : exp.title || exp.description}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Column: Objectives, Outcomes & References */}
          <div className="space-y-6">
            {/* Course Objectives */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/20">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListChecks className="text-indigo-500" size={18} /> Course Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2.5">
                {objectives.length > 0 ? (
                  objectives.map((obj: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{obj}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 font-mono">No explicitly extracted objectives.</p>
                )}
              </CardContent>
            </Card>

            {/* Course Outcomes */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="text-emerald-500" size={18} /> Course Outcomes (COs)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2.5">
                {outcomes.length > 0 ? (
                  outcomes.map((oc: any, idx: number) => {
                    const isObj = typeof oc === 'object' && oc !== null;
                    const desc = isObj ? (oc.description || oc.statement || oc.title || String(oc)) : String(oc);
                    const coCode = isObj && oc.code ? oc.code : `CO${idx + 1}`;
                    const bloom = isObj && oc.bloomLevel ? oc.bloomLevel : null;

                    return (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                          {coCode}
                        </span>
                        <span className="mt-0.5 flex-1">{desc}</span>
                        {bloom && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold shrink-0">
                            {bloom}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 font-mono">No explicitly extracted course outcomes.</p>
                )}
              </CardContent>
            </Card>

            {/* Textbooks & References */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Bookmark className="text-amber-500" size={18} /> Textbooks & References
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Textbooks */}
                <div>
                  <h5 className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase mb-2">Textbooks</h5>
                  {textbooks.length > 0 ? (
                    textbooks.map((tb: string, idx: number) => (
                      <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 flex items-start gap-1.5">
                        <span className="text-amber-500">•</span> {tb}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">None specified</p>
                  )}
                </div>

                {/* References */}
                {references.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Reference Books</h5>
                    {references.map((rf: string, idx: number) => (
                      <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 mb-1.5 flex items-start gap-1.5">
                        <span className="text-slate-400">•</span> {rf}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Version Comparison Modal */}
        <VersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          versions={versions}
          currentVersion={versionNum}
          onRestoreVersion={handleRestoreVersion}
          onDeleteVersion={handleDeleteVersion}
        />

        {/* Delete Confirmation Modal Card */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-red-500/30 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-red-500">
                  <AlertCircle size={24} />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Syllabus Record?</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{courseCode}: {courseName}</strong> from the repository? This action removes stored content and version history.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold"
                  >
                    Confirm Delete
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CO-PO Mapping Matrix Modal */}
        <CoPoMappingModal
          isOpen={isCoPoOpen}
          onClose={() => setIsCoPoOpen(false)}
          syllabusData={syllabusData}
          onSaved={loadSyllabus}
        />
      </div>
    </AppShell>
  );
}
