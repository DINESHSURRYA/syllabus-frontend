"use client";
import './styles/TeachingStrategiesModal.css';
import React, { useEffect, useRef } from "react";
import { BookOpen, X, Sparkles, Clock, Users, Layers, Award, Target, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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

  // Scroll detection to trigger interactive scrollbar animation
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border border-indigo-500/30 bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl custom-scrollbar text-[var(--text-primary)] transition-all duration-300 scale-100 backdrop-blur-2xl"
      >
        {/* Decorative Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Header Banner */}
        <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-5 gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3 py-1 rounded-full shadow-xs">
                Category #{category.number}
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-500" />
                {category.strategies.length} Strategies Available
              </span>
              {category.confidenceScore && (
                <span className="text-xs font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck size={13} className="text-cyan-500" />
                  {category.confidenceScore}% AI Confidence
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-[var(--text-primary)] tracking-tight">
              {category.category}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium font-sans">
              {category.description}
            </p>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close Modal"
            className="p-2.5 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all hover:rotate-90 hover:scale-105 active:scale-95 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Teaching Metadata HUD Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 sm:p-5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-inner">
          <div className="space-y-1">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block">
              Teaching Style
            </span>
            <strong className="text-[var(--text-primary)] font-extrabold text-xs sm:text-sm font-sans block">
              {category.teachingStyle}
            </strong>
          </div>
          <div className="space-y-1 sm:border-l sm:border-[var(--border-subtle)] sm:pl-4">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block">
              Target Student Level
            </span>
            <strong className="text-[var(--text-primary)] font-extrabold text-xs sm:text-sm font-sans block">
              {category.suitableStudentLevel}
            </strong>
          </div>
          <div className="space-y-1 sm:border-l sm:border-[var(--border-subtle)] sm:pl-4">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block">
              Estimated Engagement
            </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm font-sans block flex items-center gap-1">
              <Zap size={14} className="text-emerald-500" />
              {category.estimatedEngagement}
            </strong>
          </div>
        </div>

        {/* Teaching Methods & Strategies Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-mono font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Available Teaching Strategies ({category.strategies.length})
            </h3>
          </div>

          <div className="space-y-4">
            {category.strategies.map((strat, sIdx) => (
              <div 
                key={sIdx} 
                className="rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4 shadow-md hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 group"
              >
                {/* Strategy Header */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h4 className="text-sm sm:text-base font-extrabold font-sans text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-mono text-xs flex items-center justify-center font-black shadow-xs shrink-0">
                      {sIdx + 1}
                    </span>
                    {strat.strategyName}
                  </h4>
                  <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-xs">
                    <Clock size={13} className="text-indigo-500" />
                    {strat.durationMinutes} Mins Duration
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium font-sans">
                  {strat.description}
                </p>
                
                {/* High Contrast Classroom Activity Blueprint Box */}
                <div className="p-4 rounded-xl border-l-4 border-l-emerald-500 border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent space-y-1.5 shadow-xs">
                  <div className="text-emerald-700 dark:text-emerald-400 font-mono uppercase text-[11px] font-black tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-500 shrink-0" />
                    <span>Classroom Activity Blueprint:</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed font-medium font-sans">
                    {strat.classroomActivity}
                  </p>
                </div>

                {/* Metadata Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] font-sans">
                  <div>
                    Classroom Size: <strong className="text-[var(--text-primary)] font-bold">{strat.bestClassroomSize}</strong>
                  </div>
                  <div>
                    Delivery Mode: <strong className="text-[var(--text-primary)] font-bold">{strat.deliveryMode}</strong>
                  </div>
                  <div>
                    Materials Required: <strong className="text-[var(--text-primary)] font-bold">{strat.materialsRequired?.join(", ") || "Standard Classroom"}</strong>
                  </div>
                  <div>
                    Assessment Method: <strong className="text-[var(--text-primary)] font-bold">{strat.assessmentMethod}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
