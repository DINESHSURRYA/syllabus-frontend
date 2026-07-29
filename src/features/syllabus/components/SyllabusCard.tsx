import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Award, Grid3X3, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

interface SyllabusCardProps {
  syllabus: any;
  onOpenCoPo: (syllabus: any, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SyllabusCard({ syllabus, onOpenCoPo, onDelete }: SyllabusCardProps) {
  const code = syllabus.courseCode || syllabus.code || syllabus.course?.code || 'CS';
  const title = syllabus.courseName || syllabus.title || syllabus.course?.title || 'Syllabus';
  const department = syllabus.department || syllabus.course?.department || 'Engineering';
  const semester = syllabus.semester || syllabus.course?.semester || 'Semester V';
  const id = syllabus.id || syllabus._id || code;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
        <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {code}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{semester}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <Link href={ROUTES.SYLLABUS.DETAIL(id)}>{title}</Link>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {department}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => onOpenCoPo(syllabus, e)}
              className="flex-1 text-xs font-semibold hover:border-indigo-500 hover:text-indigo-600"
            >
              <Grid3X3 className="w-3.5 h-3.5 mr-1" />
              CO-PO Matrix
            </Button>

            <Link href={ROUTES.SYLLABUS.DETAIL(id)} passHref>
              <Button size="sm" className="text-xs font-semibold">
                <Eye className="w-3.5 h-3.5 mr-1" />
                View Details
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onDelete(id, e)}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
