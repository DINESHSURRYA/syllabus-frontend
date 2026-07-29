"use client";
import './styles/duplicate-dialog.css';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  SkipForward, 
  RefreshCw, 
  GitBranch, 
  Eye, 
  Ban, 
  FileText,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export interface DuplicateDialogProps {
  isOpen: boolean;
  duplicateInfo: {
    duplicate_type?: string;
    matched_level?: string;
    similarity_score?: number;
    matching_syllabus_id?: string;
    matching_syllabus?: {
      courseCode?: string;
      courseName?: string;
      university?: string;
      regulation?: string;
      department?: string;
      versionNumber?: number;
    };
  } | null;
  onSelectOption: (option: 'skip' | 'update' | 'new_version' | 'view_existing' | 'cancel') => void;
  onClose: () => void;
}

export function DuplicateDialog({ isOpen, duplicateInfo, onSelectOption, onClose }: DuplicateDialogProps) {
  if (!isOpen || !duplicateInfo) return null;

  const matching = duplicateInfo.matching_syllabus || {};
  const simScore = duplicateInfo.similarity_score ? duplicateInfo.similarity_score.toFixed(1) : '100.0';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl text-slate-100"
        >
          {/* Dialog Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Duplicate Syllabus Detected
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {duplicateInfo.matched_level || 'Duplicate Match'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  This syllabus already exists in the repository. What would you like to do?
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectOption('cancel')}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dialog Content & Matched Info Card */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Matched Syllabus Summary Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
                  <FileText size={14} />
                  <span>MATCHING SYLLABUS RECORD</span>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Similarity: {simScore}%
                </span>
              </div>
              <div className="flex items-start justify-between pt-1">
                <div>
                  <h4 className="text-base font-bold text-slate-200">
                    {matching.courseCode ? `${matching.courseCode} - ` : ''}{matching.courseName || 'Existing Course Syllabus'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {matching.university || 'Standard University'} • {matching.department || 'Computer Science'} • {matching.regulation || 'R2021'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Current Ver: v{matching.versionNumber || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Choices Grid */}
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Select Resolution Action:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Skip Upload */}
                <button
                  onClick={() => onSelectOption('skip')}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-slate-700 transition-colors mt-0.5">
                    <SkipForward size={18} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300">Skip Upload</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Cancel upload and keep existing syllabus unchanged in repository.</p>
                  </div>
                </button>

                {/* 2. Update Existing */}
                <button
                  onClick={() => onSelectOption('update')}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 text-left transition-all"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors mt-0.5">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-blue-300">Update Existing</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Replace stored syllabus, preserve version history, and update timestamp.</p>
                  </div>
                </button>

                {/* 3. Save as New Version */}
                <button
                  onClick={() => onSelectOption('new_version')}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-left transition-all"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors mt-0.5">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-emerald-300">Save as New Version</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Store as v{(matching.versionNumber || 1) + 1}, keeping version history for comparison.</p>
                  </div>
                </button>

                {/* 4. View Existing */}
                <button
                  onClick={() => onSelectOption('view_existing')}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 text-left transition-all"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors mt-0.5">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-purple-300">View Existing</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Open already saved syllabus in repository before making a decision.</p>
                  </div>
                </button>
              </div>

              {/* 5. Cancel Button */}
              <div className="pt-2">
                <button
                  onClick={() => onSelectOption('cancel')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  <Ban size={16} />
                  Cancel Upload
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
