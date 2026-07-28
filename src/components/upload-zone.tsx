"use client";

import { motion } from 'framer-motion';
import { FileUp, Loader2, Paperclip, XCircle, Lock } from 'lucide-react';
import { useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  file?: File | null;
  isUploading?: boolean;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, onRemove, file, isUploading, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileSelect(dropped);
  };

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.01 : 1,
          borderColor: disabled
            ? 'rgba(148, 163, 184, 0.3)'
            : isDragging
            ? '#2563eb'
            : 'rgba(255,255,255,0.15)',
        }}
        className={`rounded-[30px] border border-dashed p-8 text-center backdrop-blur-xl shadow-md relative overflow-hidden group transition-colors ${
          disabled
            ? 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-70 cursor-not-allowed'
            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/15 shadow-sm'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
          disabled
            ? 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-400'
            : 'border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 shadow-sm group-hover:scale-105 transition-transform'
        }`}>
          {disabled ? <Lock size={28} /> : <FileUp size={28} />}
        </div>

        <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          {disabled ? 'Document Uploader Locked' : 'Drop your syllabus file here'}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-mono font-semibold">
          {disabled
            ? 'Enter a valid, unique Course Code above to enable file selection'
            : 'PDF, DOCX, JSON, PNG, JPEG supported for AI extraction'}
        </p>

        <div className="mt-6 flex justify-center relative z-10">
          <label className={`rounded-xl border px-6 py-3 text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
            disabled
              ? 'border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'cursor-pointer border-indigo-300 dark:border-indigo-500/40 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-900'
          }`}>
            Browse Document
            <input
              type="file"
              className="hidden"
              disabled={disabled}
              accept=".pdf,.docx,.json,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files?.[0] && !disabled && onFileSelect(e.target.files[0])}
            />
          </label>
        </div>
      </motion.div>

      {file && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-4 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-600 dark:text-indigo-300">
              <Paperclip size={20} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR EXTRACTION</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUploading ? (
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={18} />
            ) : (
              <button onClick={onRemove} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-500 transition-colors">
                <XCircle size={18} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
