"use client";

import React, { useEffect, useRef } from "react";
import { 
  BookOpen, 
  X, 
  Sparkles, 
  Clock, 
  Users, 
  Layers, 
  Target, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  GraduationCap
} from "lucide-react";
import { CatalogPedagogyCategory } from "@/lib/data/pedagogies-catalog-data";

interface TeachingStrategiesModalProps {
  category: CatalogPedagogyCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeachingStrategiesModal: React.FC<TeachingStrategiesModalProps> = ({
  category,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll detection for scrollbar effect
  useEffect(() => {
    const el = modalRef.current;
    if (!el || !isOpen) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      el.classList.add("is-scrolling");
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        el.classList.remove("is-scrolling");
      }, 700);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  if (!isOpen || !category) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-2xl transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 dark:border-cyan-500/20 bg-slate-900/90 dark:bg-slate-950/90 text-slate-100 p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 custom-scrollbar transition-all duration-300 scale-100"
      >
        {/* Decorative Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-6 gap-4">
          <div className="space-y-3">
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full shadow-xs backdrop-blur-md">
                Category #{category.number}
              </span>
              
              <span className="text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <CheckCircle2 size={13} className="text-emerald-400" />
                {category.strategies.length} Strategies Available
              </span>

              {category.confidenceScore && (
                <span className="text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck size={13} className="text-cyan-400" />
                  {category.confidenceScore}% AI Confidence
                </span>
              )}
            </div>

            {/* Category Title & Description */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight">
              {category.category}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl font-normal">
              {category.description}
            </p>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            aria-label="Close Modal"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Teaching Metadata HUD Glass Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
              Teaching Style
            </span>
            <strong className="text-slate-100 font-bold text-sm block">
              {category.teachingStyle}
            </strong>
          </div>

          <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-5">
            <span className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
              Target Student Level
            </span>
            <strong className="text-slate-100 font-bold text-sm block">
              {category.suitableStudentLevel}
            </strong>
          </div>

          <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-5">
            <span className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
              Estimated Engagement
            </span>
            <strong className="text-emerald-400 font-black text-sm flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-400 fill-emerald-400/20" />
              {category.estimatedEngagement}
            </strong>
          </div>
        </div>

        {/* Strategies Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Available Teaching Strategies
            </h3>
          </div>

          {/* Strategy List */}
          <div className="space-y-4">
            {category.strategies.map((strat, sIdx) => (
              <div 
                key={sIdx} 
                className="group relative rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-lg hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Header Row */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-mono text-xs flex items-center justify-center font-black shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                      {sIdx + 1}
                    </span>
                    {strat.strategyName}
                  </h4>

                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-xs">
                    <Clock size={13} className="text-indigo-400" />
                    {strat.durationMinutes} mins
                  </span>
                </div>

                {/* Strategy Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {strat.description}
                </p>
                
                {/* Spotlight Classroom Activity Box */}
                <div className="relative p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/20 border border-emerald-500/30 space-y-2 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                  <span className="text-emerald-400 font-mono uppercase text-[10px] font-black tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-400" />
                    Classroom Activity Blueprint
                  </span>
                  <p className="text-slate-100 text-xs sm:text-sm leading-relaxed font-medium pl-1">
                    {strat.classroomActivity}
                  </p>
                </div>

                {/* Tag Grid Details */}
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                    <Users size={13} className="text-slate-400" />
                    Size: <strong className="text-slate-200">{strat.bestClassroomSize}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                    <Layers size={13} className="text-slate-400" />
                    Mode: <strong className="text-slate-200">{strat.deliveryMode}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                    <GraduationCap size={13} className="text-slate-400" />
                    Materials: <strong className="text-slate-200">{strat.materialsRequired?.join(", ") || "Standard Classroom"}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                    <Target size={13} className="text-slate-400" />
                    Assessment: <strong className="text-slate-200">{strat.assessmentMethod}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};