"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, Layers, X, Calendar, User, CheckCircle2, BookOpen, Building2 } from 'lucide-react';

export interface ExistingCourseData {
  courseCode: string;
  courseName: string;
  department: string;
  uploadedOn: string;
  uploadedBy: string;
  status: string;
  existingSyllabusId?: string;
}

interface CourseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: ExistingCourseData | null;
  onViewExisting: (syllabusId: string) => void;
  onCreateNewVersion: (courseCode: string) => void;
}

export const CourseCodeModal: React.FC<CourseCodeModalProps> = ({
  isOpen,
  onClose,
  courseData,
  onViewExisting,
  onCreateNewVersion
}) => {
  if (!isOpen || !courseData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Course Already Exists</h3>
                <p className="text-xs text-slate-400">Course code <span className="font-semibold text-amber-400">{courseData.courseCode}</span> is registered in the database.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Details Card */}
          <div className="my-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>{courseData.courseName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Department:</span>
                <span className="font-medium">{courseData.department}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-emerald-400">{courseData.status}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Uploaded On:</span>
                <span className="font-medium">{new Date(courseData.uploadedOn).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Uploaded By:</span>
                <span className="font-medium">{courseData.uploadedBy}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Would you like to view the existing verified syllabus or upload this file as a new version (e.g. Version 2)?
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => onViewExisting(courseData.existingSyllabusId || courseData.courseCode)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 text-xs font-semibold border border-slate-700 transition"
            >
              <Eye className="h-4 w-4 text-sky-400" />
              View Existing
            </button>

            <button
              onClick={() => onCreateNewVersion(courseData.courseCode)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-2.5 px-4 text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
            >
              <Layers className="h-4 w-4" />
              Create New Version
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 py-2.5 px-3 text-xs font-medium border border-transparent transition"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
