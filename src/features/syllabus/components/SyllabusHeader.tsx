import React from 'react';
import Link from 'next/link';
import { Search, Plus, LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

interface SyllabusHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  recycleBinCount: number;
  onOpenRecycleBin: () => void;
}

export function SyllabusHeader({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  recycleBinCount,
  onOpenRecycleBin,
}: SyllabusHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Syllabus Repository</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage, search, and map outcome matrices for university course syllabi.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search syllabus..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600' : 'text-slate-400'
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={onOpenRecycleBin} className="relative">
          <Trash2 className="w-4 h-4 mr-1.5 text-slate-500" />
          Recycle Bin
          {recycleBinCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
              {recycleBinCount}
            </span>
          )}
        </Button>

        <Link href={ROUTES.UPLOAD}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Upload Syllabus
          </Button>
        </Link>
      </div>
    </div>
  );
}
