"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Plus,
  BookOpen,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Eye,
  Edit3,
  Trash2,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  Home,
  ShieldCheck,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  getSyllabusList, 
  deleteSyllabusRepository, 
  restoreSyllabusRepository,
  permanentDeleteSyllabusRepository,
  emptyRecycleBinRepository,
  bulkDeleteRecycleBinRepository,
  bulkRestoreRecycleBinRepository,
  verifySyllabusRepository, 
  getSyllabusDownloadUrl,
  getOriginalFileUrl
} from '@/lib/api-client';
import { VerificationSuccessModal } from '@/components/syllabus/verification-success-modal';
import { useGuideStore } from '@/lib/guide-store';


function SyllabusRepositoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { highlightedTargetId } = useGuideStore();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 9 });
  const [filterOptions, setFilterOptions] = useState<any>({
    universities: [],
    departments: [],
    regulations: [],
    semesters: [],
    academicYears: [],
    statuses: []
  });

  // Verification Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<any>({});

  // Check URL query parameters for redirect from Verification page
  useEffect(() => {
    if (searchParams) {
      const isVerified = searchParams.get('verified') === 'true';
      if (isVerified) {
        const id = searchParams.get('id') || '';
        const code = searchParams.get('code') || 'CS3451';
        const title = searchParams.get('title') || 'Introduction to Operating Systems';
        setVerifiedInfo({
          id,
          courseCode: code,
          courseName: title,
          university: 'Standard University',
          department: 'Computer Science & Engineering',
          regulation: 'R2021',
          semester: 'Semester V'
        });
        setShowSuccessModal(true);
      }
    }
  }, [searchParams]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRegulation, setSelectedRegulation] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Recycle Bin State
  const [recycleBinCount, setRecycleBinCount] = useState<number>(0);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState<boolean>(false);
  const [recycledSyllabi, setRecycledSyllabi] = useState<any[]>([]);
  const [loadingRecycleBin, setLoadingRecycleBin] = useState<boolean>(false);
  const [permanentDeleteConfirmId, setPermanentDeleteConfirmId] = useState<string | null>(null);

  // Bulk & Selective Delete State
  const [selectedRecycleIds, setSelectedRecycleIds] = useState<string[]>([]);
  const [showEmptyRecycleConfirm, setShowEmptyRecycleConfirm] = useState<boolean>(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);

  // Fetch Recycle Bin items
  const fetchRecycleBin = async () => {
    setLoadingRecycleBin(true);
    try {
      const data = await getSyllabusList({ only_archived: true, limit: 100 });
      setRecycledSyllabi(data.items || []);
      setRecycleBinCount((data.items || []).length);
    } catch (err) {
      console.error("Failed to load recycle bin:", err);
    } finally {
      setLoadingRecycleBin(false);
    }
  };

  // Fetch Syllabus Repository Data
  const fetchRepository = async () => {
    setLoading(true);
    try {
      const data = await getSyllabusList({
        search: searchQuery,
        university: selectedUniversity,
        department: selectedDepartment,
        regulation: selectedRegulation,
        semester: selectedSemester,
        academic_year: selectedAcademicYear,
        status: selectedStatus,
        sort_by: sortBy,
        order: sortOrder,
        page: page,
        limit: pagination.limit
      });

      setSyllabi(data.items || []);
      setPagination(data.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 9 });
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
      }
    } catch (err: any) {
      console.error("Failed to load syllabus repository:", err);
      showToast("Error loading syllabus repository.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepository();
    fetchRecycleBin();
  }, [
    searchQuery,
    selectedUniversity,
    selectedDepartment,
    selectedRegulation,
    selectedSemester,
    selectedAcademicYear,
    selectedStatus,
    sortBy,
    sortOrder,
    page
  ]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleVerifyCard = async (sItem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await verifySyllabusRepository(sItem.id);
      setVerifiedInfo({
        id: sItem.id,
        courseCode: sItem.courseCode || sItem.code || 'COURSE',
        courseName: sItem.courseName || sItem.subjectName || 'Syllabus',
        university: sItem.university,
        department: sItem.department,
        regulation: sItem.regulation,
        semester: sItem.semester,
        credits: sItem.credits
      });
      setShowSuccessModal(true);
      fetchRepository();
    } catch (err) {
      showToast("Failed to verify syllabus.", "error");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await deleteSyllabusRepository(id, true);
      showToast("Course moved to Recycle Bin.", "success");
      setDeleteConfirmId(null);
      fetchRepository();
      fetchRecycleBin();
    } catch (err) {
      showToast("Failed to move course to Recycle Bin.", "error");
    }
  };

  const handleRestore = async (id: string) => {
    // Optimistic UI Update
    setRecycledSyllabi(prev => prev.filter(item => item.id !== id));
    setRecycleBinCount(prev => Math.max(0, prev - 1));
    setSelectedRecycleIds(prev => prev.filter(i => i !== id));
    try {
      await restoreSyllabusRepository(id);
      showToast("Course restored successfully to repository.", "success");
      fetchRepository();
    } catch (err) {
      showToast("Failed to restore course.", "error");
      fetchRecycleBin();
    }
  };

  const handlePermanentDelete = async (id: string) => {
    // Optimistic UI Update
    setRecycledSyllabi(prev => prev.filter(item => item.id !== id));
    setRecycleBinCount(prev => Math.max(0, prev - 1));
    setSelectedRecycleIds(prev => prev.filter(i => i !== id));
    setPermanentDeleteConfirmId(null);
    try {
      await permanentDeleteSyllabusRepository(id);
      showToast("Course permanently deleted from Database.", "success");
      fetchRepository();
    } catch (err) {
      showToast("Failed to permanently delete course.", "error");
      fetchRecycleBin();
    }
  };

  const handleToggleSelectRecycle = (id: string) => {
    setSelectedRecycleIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllRecycle = () => {
    if (selectedRecycleIds.length === recycledSyllabi.length) {
      setSelectedRecycleIds([]);
    } else {
      setSelectedRecycleIds(recycledSyllabi.map(item => item.id));
    }
  };

  const handleEmptyRecycleBin = async () => {
    setRecycledSyllabi([]);
    setRecycleBinCount(0);
    setSelectedRecycleIds([]);
    setShowEmptyRecycleConfirm(false);
    try {
      const res = await emptyRecycleBinRepository();
      showToast(res.message || "Recycle Bin emptied successfully.", "success");
      fetchRepository();
    } catch (err) {
      showToast("Failed to empty Recycle Bin.", "error");
      fetchRecycleBin();
    }
  };

  const handleBulkRestore = async () => {
    if (selectedRecycleIds.length === 0) return;
    const idsToRestore = [...selectedRecycleIds];
    setRecycledSyllabi(prev => prev.filter(item => !idsToRestore.includes(item.id)));
    setRecycleBinCount(prev => Math.max(0, prev - idsToRestore.length));
    setSelectedRecycleIds([]);
    try {
      const res = await bulkRestoreRecycleBinRepository(idsToRestore);
      showToast(res.message || `Restored ${idsToRestore.length} courses.`, "success");
      fetchRepository();
    } catch (err) {
      showToast("Failed to restore selected courses.", "error");
      fetchRecycleBin();
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedRecycleIds.length === 0) return;
    const idsToDelete = [...selectedRecycleIds];
    setRecycledSyllabi(prev => prev.filter(item => !idsToDelete.includes(item.id)));
    setRecycleBinCount(prev => Math.max(0, prev - idsToDelete.length));
    setSelectedRecycleIds([]);
    setShowBulkDeleteConfirm(false);
    try {
      const res = await bulkDeleteRecycleBinRepository(idsToDelete);
      showToast(res.message || `Permanently deleted ${idsToDelete.length} courses.`, "success");
      fetchRepository();
    } catch (err) {
      showToast("Failed to permanently delete selected courses.", "error");
      fetchRecycleBin();
    }
  };


  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSyllabusRepository(id, true);
      showToast("Syllabus archive status toggled.", "success");
      fetchRepository();
      fetchRecycleBin();
    } catch (err) {
      showToast("Failed to archive syllabus.", "error");
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUniversity('');
    setSelectedDepartment('');
    setSelectedRegulation('');
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Remove query params cleanly from browser URL
    router.replace('/syllabus');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Verification Joyful Celebration Modal */}
      <VerificationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        onViewDetails={verifiedInfo.id ? () => {
          setShowSuccessModal(false);
          router.push(`/syllabus/${verifiedInfo.id}`);
        } : undefined}
        syllabusInfo={verifiedInfo}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/90 border-red-500/40 text-red-300'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-cyan-500 flex items-center gap-1">
          <Home size={14} /> Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Syllabus Repository</span>
      </nav>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 dark:from-slate-900/95 dark:via-indigo-950/40 dark:to-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
              <Library size={14} /> Central Repository
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
              Syllabus Repository
              <span className="text-xs font-mono font-normal px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                {pagination.totalItems} Syllabi Listed
              </span>
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm max-w-2xl leading-relaxed">
              Central storage of every extracted, structured, and verified university syllabus with version tracking & curriculum trees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                fetchRecycleBin();
                setShowRecycleBinModal(true);
              }}
              variant="outline"
              size="lg"
              className="border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl relative flex items-center gap-2 shadow-sm"
            >
              <Trash2 size={18} className="text-red-500" />
              Recycle Bin
              {recycleBinCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold font-mono rounded-full bg-red-500 text-white shadow-sm animate-pulse">
                  {recycleBinCount}
                </span>
              )}
            </Button>

            <Button
              onClick={() => router.push('/upload')}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg rounded-xl"
            >
              <Plus size={18} className="mr-2" /> Upload New Syllabus
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Course Name, Code, Subject, or University..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono shadow-inner font-medium"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Toggle Button */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 font-semibold ${
              showFilters ? 'border-indigo-500 bg-indigo-50 text-indigo-950 dark:text-indigo-300' : ''
            }`}
          >
            <Filter size={16} className="mr-2" /> Filters
            {(selectedUniversity || selectedDepartment || selectedRegulation || selectedSemester || selectedStatus) && (
              <span className="ml-2 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            )}
          </Button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 font-semibold">
            <ArrowUpDown size={14} className="text-slate-600 dark:text-slate-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-indigo-700 dark:text-indigo-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="lastModified" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Last Modified</option>
              <option value="uploadDate" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Upload Date</option>
              <option value="courseName" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Course Name</option>
              <option value="courseCode" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Course Code</option>
              <option value="versionNumber" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Version Number</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-1 text-slate-700 hover:text-indigo-700 font-bold"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 backdrop-blur-md space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <SlidersHorizontal size={14} /> Repository Filter Panel
              </h4>
              <button onClick={resetFilters} className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline font-mono">
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* University Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">University</label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Universities</option>
                  {filterOptions.universities?.map((u: string) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Departments</option>
                  {filterOptions.departments?.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Regulation Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">Regulation</label>
                <select
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Regulations</option>
                  {filterOptions.regulations?.map((r: string) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Semesters</option>
                  {filterOptions.semesters?.map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Years</option>
                  {filterOptions.academicYears?.map((y: string) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Statuses</option>
                  {filterOptions.statuses?.map((st: string) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeletons */}
      {loading ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
              <div className="flex justify-between pt-2">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : syllabi.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
            <Library size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Syllabus Records Found</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            No syllabus matching your search or filters was found in the repository. Try clearing your filters or upload a new syllabus.
          </p>
          <div className="pt-2">
            <Button onClick={resetFilters} variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Reset Filters
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW WITH RICH VIBRANT CARDS */
        <div
          id="guide-syllabus-list"
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 rounded-3xl transition-all ${
            highlightedTargetId === 'guide-syllabus-list'
              ? 'ring-4 ring-amber-400 p-2 shadow-[0_0_35px_rgba(245,158,11,0.5)] animate-pulse'
              : ''
          }`}
        >
          {syllabi.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => router.push(`/syllabus/${s.id}`)}
              className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-indigo-500/50 p-6 backdrop-blur-xl transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              {/* Vibrant Top Edge Gradient Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Badges Header */}
                <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {s.courseCode || 'SYLLABUS'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      v{s.versionNumber || 1}
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        s.verificationStatus === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {s.verificationStatus || 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Course Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {s.courseName || s.subjectName || 'Untitled Course'}
                </h3>

                {/* University & Department */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-500 shrink-0" />
                  <span className="line-clamp-1">{s.university || 'Standard University'}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-purple-500 shrink-0" />
                  <span className="line-clamp-1">{s.department || 'Computer Science'}</span>
                </p>

                {/* Metadata Chips Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs font-mono">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-500 block text-[10px]">REGULATION</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.regulation || 'R2021'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-500 block text-[10px]">SEMESTER</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.semester || 'Semester V'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-500 block text-[10px]">ACADEMIC YEAR</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.academicYear || '2023-2024'}</span>
                  </div>
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] font-bold">CREDITS</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{s.credits || 4} Credits</span>
                  </div>
                </div>
              </div>

              {/* Footer Timestamps & Quick Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex flex-col">
                  <span>Uploaded: {s.uploadDate ? new Date(s.uploadDate).toLocaleDateString() : 'Recent'}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Modified: {s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'Recent'}</span>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* View Original File Button */}
                  <a
                    href={getOriginalFileUrl(s.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-1 font-mono text-[11px] font-bold"
                    title="View / Download Original Uploaded Document"
                  >
                    <FileText size={15} />
                    <span>Doc</span>
                  </a>
                  {/* Quick Verify Button */}
                  <button
                    onClick={(e) => handleVerifyCard(s, e)}
                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/20"
                    title="Verify Syllabus & Launch Celebration"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => router.push(`/syllabus/${s.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-300"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => router.push(`/verification?id=${s.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300"
                    title="Edit Syllabus"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => router.push(`/curriculum?id=${s.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-300"
                    title="Generate Curriculum Tree"
                  >
                    <GitBranch size={16} />
                  </button>
                  <a
                    href={getSyllabusDownloadUrl(s.id, 'json')}
                    download
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-300"
                    title="Download JSON"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(s.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500"
                    title="Move to Recycle Bin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Course</th>
                <th className="p-4">University & Dept</th>
                <th className="p-4">Regulation / Sem</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Version</th>
                <th className="p-4">Status</th>
                <th className="p-4">Modified</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {syllabi.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/syllabus/${s.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300">
                      {s.courseName || s.subjectName}
                    </div>
                    <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold mt-0.5">{s.courseCode}</div>
                  </td>
                  <td className="p-4 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-semibold">{s.university || 'Standard University'}</div>
                    <div className="text-slate-500">{s.department}</div>
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <div className="font-semibold">{s.regulation || 'R2021'}</div>
                    <div className="text-slate-500">{s.semester}</div>
                  </td>
                  <td className="p-4 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                    {s.credits || 4}
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      v{s.versionNumber || 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                        s.verificationStatus === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {s.verificationStatus || 'Verified'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    {s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={getOriginalFileUrl(s.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-1 font-mono text-[11px] font-bold"
                        title="View / Download Original Uploaded Document"
                      >
                        <FileText size={15} />
                        <span>Doc</span>
                      </a>
                      <button
                        onClick={(e) => handleVerifyCard(s, e)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/20"
                        title="Verify Syllabus & Launch Celebration"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/syllabus/${s.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-300"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/verification?id=${s.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span>
            Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} Total Records)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </Button>

            <span className="px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-slate-900 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-bold">
              {page}
            </span>

            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <Trash2 size={24} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Move Course to Recycle Bin?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This course will be soft-deleted and moved to the Recycle Bin. You can restore it anytime or delete it permanently from the Recycle Bin.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
                <Button onClick={() => handleSoftDelete(deleteConfirmId)} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">
                  Move to Recycle Bin
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recycle Bin Drawer / Modal */}
      <AnimatePresence>
        {showRecycleBinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Recycle Bin
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                        {recycledSyllabi.length} Items
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Soft-deleted courses. Restore them back to active repository or permanently delete them from DB.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {recycledSyllabi.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowEmptyRecycleConfirm(true)}
                      className="border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Empty Recycle Bin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowRecycleBinModal(false)}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Bulk Action & Multi-Select Bar */}
              {recycledSyllabi.length > 0 && (
                <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAllRecycle}
                      className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                    >
                      {selectedRecycleIds.length > 0 && selectedRecycleIds.length === recycledSyllabi.length ? (
                        <CheckSquare size={16} className="text-red-500" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                      <span>Select All ({recycledSyllabi.length})</span>
                    </button>
                    {selectedRecycleIds.length > 0 && (
                      <span className="font-mono text-red-500 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                        {selectedRecycleIds.length} Selected
                      </span>
                    )}
                  </div>

                  {selectedRecycleIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleBulkRestore}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 py-1 px-3"
                      >
                        <RotateCcw size={13} /> Restore Selected ({selectedRecycleIds.length})
                      </Button>
                      <Button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 py-1 px-3"
                      >
                        <Trash2 size={13} /> Delete Selected from DB ({selectedRecycleIds.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingRecycleBin ? (
                  <div className="py-12 text-center text-slate-500 font-mono">Loading Recycle Bin...</div>
                ) : recycledSyllabi.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Trash2 size={24} />
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Recycle Bin is Empty</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      There are no soft-deleted courses in the Recycle Bin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recycledSyllabi.map((item) => {
                      const isSelected = selectedRecycleIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                            isSelected
                              ? 'border-red-500 bg-red-500/5 dark:bg-red-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-red-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleSelectRecycle(item.id)}
                              className="mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-red-500" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                  {item.courseCode || 'COURSE'}
                                </span>
                                <span className="text-xs font-mono text-slate-500">
                                  v{item.versionNumber || 1}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  Soft Deleted
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {item.courseName || item.subjectName}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono pt-1 flex-wrap">
                                <span>{item.university || 'Standard University'}</span>
                                <span>•</span>
                                <span>{item.department}</span>
                                <span>•</span>
                                <span>{item.semester}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-center">
                            {/* Restore Button */}
                            <Button
                              onClick={() => handleRestore(item.id)}
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold text-xs flex items-center gap-1.5"
                            >
                              <RotateCcw size={14} /> Restore
                            </Button>

                            {/* Permanent Delete Button */}
                            <Button
                              onClick={() => setPermanentDeleteConfirmId(item.id)}
                              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20"
                            >
                              <Trash2 size={14} /> Delete from DB
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Delete Single Item Confirmation Modal */}
      <AnimatePresence>
        {permanentDeleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-red-500/50 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Permanently Delete from DB?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure? This action will <strong className="text-red-500 font-bold">PERMANENTLY DELETE</strong> this course and all stored data from the Database. <br />
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setPermanentDeleteConfirmId(null)} className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
                <Button onClick={() => handlePermanentDelete(permanentDeleteConfirmId)} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                  Confirm Permanent Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty Recycle Bin Confirmation Modal */}
      <AnimatePresence>
        {showEmptyRecycleConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-red-500/50 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Empty Entire Recycle Bin?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to <strong className="text-red-500 font-bold">PERMANENTLY DELETE ALL {recycledSyllabi.length} COURSES</strong> in the Recycle Bin from the Database? <br />
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEmptyRecycleConfirm(false)} className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
                <Button onClick={handleEmptyRecycleBin} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                  Confirm Empty Recycle Bin
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Selected Items Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-red-500/50 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Selected Courses from DB?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to <strong className="text-red-500 font-bold">PERMANENTLY DELETE {selectedRecycleIds.length} SELECTED COURSES</strong> from the Database? <br />
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)} className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
                <Button onClick={handleBulkPermanentDelete} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                  Confirm Delete Selected ({selectedRecycleIds.length})
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function SyllabusRepositoryPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="p-12 text-center text-slate-500 font-mono">Loading Syllabus Repository...</div>
      }>
        <SyllabusRepositoryContent />
      </Suspense>
    </AppShell>
  );
}
