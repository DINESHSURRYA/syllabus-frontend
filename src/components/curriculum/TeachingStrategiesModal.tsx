"use client";

import React, { useEffect, useRef } from "react";
import { BookOpen, X, Sparkles, Clock, Users, Layers, Award, Target, CheckCircle2, ShieldCheck } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border border-cyan-500/40 dark:border-cyan-500/40 bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl custom-scrollbar text-[var(--text-primary)] transition-all duration-300 scale-100"
      >
        {/* Top Header Banner */}
        <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-5 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-xs">
                Category #{category.number}
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 eyecomfort:bg-amber-500/20 eyecomfort:text-amber-300 eyecomfort:border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400 eyecomfort:text-amber-400" />
                {category.strategies.length} Strategies Available
              </span>
              {category.confidenceScore && (
                <span className="text-xs font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 eyecomfort:bg-amber-500/20 eyecomfort:text-amber-300 eyecomfort:border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck size={13} className="text-cyan-700 dark:text-cyan-400 eyecomfort:text-amber-400" />
                  {category.confidenceScore}% AI Confidence
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {category.category}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
              {category.description}
            </p>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close Modal"
            className="p-2.5 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Teaching Metadata HUD Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6 p-4.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-inner">
          <div className="p-1">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block mb-1">
              Teaching Style
            </span>
            <strong className="text-[var(--text-primary)] font-extrabold text-xs sm:text-sm block">
              {category.teachingStyle}
            </strong>
          </div>
          <div className="p-1 sm:border-l sm:border-[var(--border-subtle)] sm:pl-3.5">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block mb-1">
              Target Student Level
            </span>
            <strong className="text-[var(--text-primary)] font-extrabold text-xs sm:text-sm block">
              {category.suitableStudentLevel}
            </strong>
          </div>
          <div className="p-1 sm:border-l sm:border-[var(--border-subtle)] sm:pl-3.5">
            <span className="text-[var(--text-muted)] font-mono text-[11px] font-bold uppercase tracking-wider block mb-1">
              Estimated Engagement
            </span>
            <strong className="text-emerald-700 dark:text-emerald-400 eyecomfort:text-amber-400 font-black text-xs sm:text-sm block">
              {category.estimatedEngagement}
            </strong>
          </div>
        </div>

        {/* Teaching Methods & Strategies Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-mono font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400 eyecomfort:text-amber-400" />
              Available Teaching Strategies ({category.strategies.length})
            </h3>
          </div>

          <div className="space-y-4">
            {category.strategies.map((strat, sIdx) => (
              <div 
                key={sIdx} 
                className="rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4 shadow-sm hover:shadow-xl hover:border-cyan-500/60 dark:hover:border-cyan-400/60 transition-all duration-300 group"
              >
                {/* Strategy Header */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h4 className="text-sm sm:text-base font-bold text-cyan-800 dark:text-cyan-300 eyecomfort:text-amber-300 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-cyan-600 dark:bg-cyan-500/25 text-white dark:text-cyan-300 font-mono text-xs flex items-center justify-center font-black shadow-xs shrink-0">
                      {sIdx + 1}
                    </span>
                    {strat.strategyName}
                  </h4>
                  <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40 eyecomfort:bg-amber-500/20 eyecomfort:text-amber-300 eyecomfort:border-amber-500/40 flex items-center gap-1 shadow-xs">
                    <Clock size={13} className="text-indigo-700 dark:text-indigo-300 eyecomfort:text-amber-300" />
                    {strat.durationMinutes} Minutes Duration
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  {strat.description}
                </p>
                
                {/* High Contrast Classroom Activity Blueprint Box */}
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300/80 dark:bg-emerald-950/60 dark:border-emerald-500/40 eyecomfort:bg-amber-950/50 eyecomfort:border-amber-500/40 rounded-xl space-y-1.5 shadow-xs">
                  <strong className="text-emerald-900 dark:text-emerald-300 eyecomfort:text-amber-300 font-mono uppercase text-[11px] font-black tracking-wider block flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-700 dark:text-emerald-400 eyecomfort:text-amber-400" />
                    Classroom Activity Blueprint:
                  </strong>
                  <p className="text-emerald-950 dark:text-emerald-100 eyecomfort:text-amber-100 text-xs sm:text-sm leading-relaxed font-semibold">
                    {strat.classroomActivity}
                  </p>
                </div>

                {/* Metadata Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
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
