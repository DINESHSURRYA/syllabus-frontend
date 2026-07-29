"use client";
import './styles/verification-success-modal.css';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Sparkles, 
  PartyPopper, 
  ArrowRight, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Award, 
  ShieldCheck,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
  syllabusInfo?: {
    id?: string;
    courseCode?: string;
    courseName?: string;
    university?: string;
    department?: string;
    regulation?: string;
    semester?: string;
    credits?: number;
  };
}

export function VerificationSuccessModal({
  isOpen,
  onClose,
  onViewDetails,
  syllabusInfo = {}
}: VerificationSuccessModalProps) {
  if (!isOpen) return null;

  const code = syllabusInfo.courseCode || 'COURSE';
  const name = syllabusInfo.courseName || 'Verified Syllabus';
  const uni = syllabusInfo.university || 'Standard University';
  const dept = syllabusInfo.department || 'Computer Science & Engineering';
  const reg = syllabusInfo.regulation || 'R2021';
  const sem = syllabusInfo.semester || 'Semester V';

  // Confetti particles generator
  const confettiParticles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * -300 - 50,
    rotation: Math.random() * 360,
    scale: Math.random() * 0.7 + 0.5,
    color: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'][i % 6],
    delay: Math.random() * 0.2
  }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Floating Confetti Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          {confettiParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                x: p.x, 
                y: [0, p.y, p.y + 120], 
                scale: [0, p.scale, p.scale],
                rotate: p.rotation + 360
              }}
              transition={{ 
                duration: 2.4, 
                ease: [0.22, 1, 0.36, 1],
                delay: p.delay
              }}
              style={{ backgroundColor: p.color }}
              className="absolute w-3 h-3 rounded-full shadow-lg"
            />
          ))}
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg rounded-[32px] border-2 border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl dark:shadow-[0_0_60px_rgba(16,185,129,0.25)] z-10 overflow-hidden"
        >
          {/* Top Decorative Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header Joyful Icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-1 shadow-lg shadow-emerald-500/30"
            >
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-emerald-400/40">
                <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 text-amber-300"
              >
                <Sparkles size={20} />
              </motion.div>
              <div className="absolute -bottom-1 -left-1 text-emerald-300">
                <PartyPopper size={20} />
              </div>
            </motion.div>

            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold tracking-wide">
              <Sparkles size={13} className="text-emerald-500 animate-spin" />
              VERIFICATION COMPLETE • REPOSITORY UPDATED
            </div>

            {/* Joyful Headline */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Syllabus Verified with Success! 🎉
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                The syllabus has been verified, locked, and successfully updated in the central syllabus repository!
              </p>
            </div>

            {/* Course Information Summary Card */}
            <div className="w-full rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-indigo-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                  {code}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 size={12} /> Verified Status Active
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} className="text-emerald-500" /> {uni}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GraduationCap size={12} className="text-emerald-500" /> {dept}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
                <span>{reg} • {sem}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ready for Curriculum & Exams</span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={onClose}
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 rounded-xl"
              >
                Explore Repository
              </Button>

              {onViewDetails ? (
                <Button
                  onClick={onViewDetails}
                  variant="outline"
                  size="lg"
                  className="w-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold rounded-xl"
                >
                  <BookOpen size={16} className="mr-2" /> View Details
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl"
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
