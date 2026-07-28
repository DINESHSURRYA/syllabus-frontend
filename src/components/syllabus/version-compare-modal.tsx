"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, ArrowLeftRight, CheckCircle2, RotateCcw, Calendar, User, Trash2 } from 'lucide-react';

export interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: any[];
  currentVersion: number;
  onRestoreVersion?: (versionNumber: number) => void;
  onDeleteVersion?: (versionNumber: number) => void;
}

export function VersionCompareModal({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestoreVersion,
  onDeleteVersion
}: VersionCompareModalProps) {
  const [v1Number, setV1Number] = useState<number>(
    versions.length > 1 ? versions[versions.length - 2]?.versionNumber || 1 : 1
  );
  const [v2Number, setV2Number] = useState<number>(currentVersion || versions[versions.length - 1]?.versionNumber || 1);

  if (!isOpen || !versions || versions.length === 0) return null;

  const version1Data = versions.find(v => v.versionNumber === v1Number) || versions[0];
  const version2Data = versions.find(v => v.versionNumber === v2Number) || versions[versions.length - 1];

  const meta1 = version1Data.metadata || {};
  const meta2 = version2Data.metadata || {};

  const units1 = version1Data.units || [];
  const units2 = version2Data.units || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <GitCompare size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Syllabus Version Comparison
                </h3>
                <p className="text-xs text-slate-400">Side-by-side diff analysis across stored versions</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Version Selection Header Row */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 border-b border-slate-800">
            {/* Version 1 Picker */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">VERSION A:</span>
                <select
                  value={v1Number}
                  onChange={(e) => setV1Number(Number(e.target.value))}
                  className="bg-slate-950 text-indigo-300 border border-slate-700 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  {versions.map((v) => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      Version {v.versionNumber} ({new Date(v.updatedAt || Date.now()).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {onDeleteVersion && versions.length > 1 && (
                  <button
                    onClick={() => onDeleteVersion(v1Number)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                    title={`Delete Version ${v1Number}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <span className="text-[11px] font-mono text-slate-500">
                  {version1Data.updatedBy || 'Admin'}
                </span>
              </div>
            </div>

            {/* Version 2 Picker */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">VERSION B:</span>
                <select
                  value={v2Number}
                  onChange={(e) => setV2Number(Number(e.target.value))}
                  className="bg-slate-950 text-indigo-300 border border-slate-700 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  {versions.map((v) => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      Version {v.versionNumber} ({new Date(v.updatedAt || Date.now()).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {onDeleteVersion && versions.length > 1 && (
                  <button
                    onClick={() => onDeleteVersion(v2Number)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                    title={`Delete Version ${v2Number}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {onRestoreVersion && v2Number !== currentVersion && (
                  <button
                    onClick={() => onRestoreVersion(v2Number)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white border border-indigo-700 text-xs font-medium hover:bg-indigo-500 transition-colors"
                  >
                    <RotateCcw size={13} />
                    Restore v{v2Number}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Panels */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-slate-800 p-6 gap-6">
            {/* Version 1 Details */}
            <div className="space-y-4 pr-2">
              <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  {meta1.courseCode ? `${meta1.courseCode} - ` : ''}{meta1.courseName || 'Course'}
                </h4>
                <p className="text-xs text-slate-400">
                  {meta1.university} • {meta1.department} • {meta1.regulation}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>Credits: {meta1.credits || 4}</span>
                  <span>Semester: {meta1.semester || 'V'}</span>
                </div>
              </div>

              {/* Units breakdown */}
              <div className="space-y-2">
                <h5 className="text-xs font-mono font-bold text-slate-400 uppercase">Units ({units1.length})</h5>
                {units1.map((u: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
                    <p className="font-bold text-slate-300">{u.title || `Unit ${idx + 1}`}</p>
                    <p className="text-slate-400 text-[11px] mt-1">{u.topics?.length || 0} Topics</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Version 2 Details */}
            <div className="space-y-4 pl-2">
              <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  {meta2.courseCode ? `${meta2.courseCode} - ` : ''}{meta2.courseName || 'Course'}
                </h4>
                <p className="text-xs text-slate-400">
                  {meta2.university} • {meta2.department} • {meta2.regulation}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>Credits: {meta2.credits || 4}</span>
                  <span>Semester: {meta2.semester || 'V'}</span>
                </div>
              </div>

              {/* Units breakdown */}
              <div className="space-y-2">
                <h5 className="text-xs font-mono font-bold text-slate-400 uppercase">Units ({units2.length})</h5>
                {units2.map((u: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
                    <p className="font-bold text-slate-300">{u.title || `Unit ${idx + 1}`}</p>
                    <p className="text-slate-400 text-[11px] mt-1">{u.topics?.length || 0} Topics</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
