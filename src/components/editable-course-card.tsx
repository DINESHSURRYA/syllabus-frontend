"use client";

import { motion } from 'framer-motion';
import { Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EditableCourseCardProps {
  title: string;
  value: string;
  onSave: (value: string) => void;
}

export function EditableCourseCard({ title, value, onSave }: EditableCourseCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-black/50 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono font-bold dark:text-slate-400 text-slate-700 uppercase tracking-wider">{title}</p>
        {!editing ? <button onClick={() => setEditing(true)} className="rounded-xl p-1.5 dark:text-slate-400 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 dark:hover:bg-white/10 transition-colors"><Edit3 size={16} /></button> : null}
      </div>
      {editing ? (
        <div className="mt-3 space-y-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-24 w-full rounded-xl border dark:border-white/10 border-slate-300 dark:bg-black bg-white p-3 text-sm dark:text-white text-slate-900 outline-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(draft); setEditing(false); }}><Save size={14} /> Save</Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold dark:text-slate-100 text-slate-900 leading-relaxed">{value}</p>
      )}
    </motion.div>
  );
}
