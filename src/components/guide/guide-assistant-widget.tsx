"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BrainCircuit,
  Cpu,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Upload,
  Library,
  Minimize2,
  Maximize2,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { useGuideStore, WORKFLOW_STEPS, WorkflowStepId } from '@/lib/guide-store';
import { Button } from '@/components/ui/button';

interface PersonaConfig {
  role: string;
  badge: string;
  icon: any;
  colorTheme: {
    border: string;
    bg: string;
    text: string;
    glow: string;
    stepActive: string;
  };
}

const PERSONAS: Record<string, PersonaConfig> = {
  dashboard: {
    role: 'Curriculum Planner',
    badge: 'PLANNING MODE',
    icon: BrainCircuit,
    colorTheme: {
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      glow: 'shadow-md',
      stepActive: 'bg-indigo-600 text-white font-bold shadow-sm',
    },
  },
  upload: {
    role: 'Syllabus Ingestion Assistant',
    badge: 'INGESTION AGENT',
    icon: Cpu,
    colorTheme: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      stepActive: 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_#10b981]',
    },
  },
  verification: {
    role: 'AI Extraction Auditor',
    badge: 'DAG AUDITOR',
    icon: ShieldCheck,
    colorTheme: {
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_25px_rgba(99,102,241,0.25)]',
      stepActive: 'bg-indigo-500 text-white font-bold shadow-[0_0_10px_#6366f1]',
    },
  },
  downstream: {
    role: 'Academic Strategist',
    badge: 'STRATEGY AGENT',
    icon: GraduationCap,
    colorTheme: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      stepActive: 'bg-amber-500 text-black font-bold shadow-[0_0_10px_#f59e0b]',
    },
  },
};

export function GuideAssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    isGuideEnabled,
    isGuideMinimized,
    activeWorkflowStep,
    duplicateDetectedCode,
    toggleGuide,
    setMinimized,
    setWorkflowStep,
    triggerHighlight,
    resetGuide,
  } = useGuideStore();

  const [activeTab, setActiveTab] = useState<'guide' | 'steps'>('guide');

  // Determine current persona based on route
  const getPersonaKey = (): string => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/upload')) return 'upload';
    if (pathname.startsWith('/verification')) return 'verification';
    return 'downstream';
  };

  const personaKey = getPersonaKey();
  const persona = PERSONAS[personaKey];
  const IconComponent = persona.icon;

  // Auto sync workflow step based on route
  useEffect(() => {
    if (pathname === '/upload') {
      if (activeWorkflowStep !== 'code_verify' && activeWorkflowStep !== 'upload_file') {
        setWorkflowStep('code_verify');
      }
    } else if (pathname === '/verification') {
      setWorkflowStep('verification_review');
    } else if (pathname === '/curriculum' || pathname === '/syllabus' || pathname === '/timeline') {
      setWorkflowStep('academic_strategy');
    }
  }, [pathname, activeWorkflowStep, setWorkflowStep]);

  if (!isGuideEnabled) {
    return null;
  }

  // Guidance logic content generator per page & step
  const renderGuidanceContent = () => {
    if (pathname === '/dashboard' || pathname === '/') {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400 shrink-0" />
            Welcome to Syllabus AI Studio!
          </p>
          <p>
            Select <strong className="text-cyan-300">"Upload Syllabus"</strong> to ingest a new course syllabus, or view the <strong>30 Pedagogies Catalog</strong>.
          </p>

          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">1</span>
              <div>
                <span className="font-semibold text-slate-200">Upload Syllabus</span>
                <p className="text-[11px] text-slate-400">Suggest starting here if you have a new course syllabus document.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">2</span>
              <div>
                <span className="font-semibold text-slate-200">Recommended Actions</span>
                <p className="text-[11px] text-slate-400">Explore CO-PO Mapping, Hierarchical View, Pedagogy, or Teaching Plan once loaded.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">3</span>
              <div>
                <span className="font-semibold text-slate-200">Pedagogies Catalog</span>
                <p className="text-[11px] text-slate-400">Explore 30 active learning strategies tailored to outcomes.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (pathname.startsWith('/upload')) {
      if (duplicateDetectedCode) {
        return (
          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                Duplicate Course Code Found!
              </p>
              <p className="mt-1 text-[11px] leading-normal text-amber-200/90">
                This course code (<span className="font-mono font-bold text-amber-300">{duplicateDetectedCode}</span>) already exists in your repository. Please go to the Syllabus Repository to delete the old version before re-uploading.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
              onClick={() => router.push('/syllabus')}
            >
              Go to Syllabus Repository <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        );
      }

      if (activeWorkflowStep === 'code_verify') {
        return (
          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Cpu size={14} className="text-emerald-400 shrink-0" />
              Step 1: Course Code Verification
            </p>
            <p>
              Enter the <strong className="text-emerald-300 font-mono">Course Code</strong> (e.g., CEC348 or CS3451) to verify whether this syllabus already exists in the repository.
            </p>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300/90">
              💡 Pre-flight verification prevents duplicate records and ensures version consistency.
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Upload size={14} className="text-emerald-400 shrink-0" />
            Step 2: Document Upload & AI Extraction
          </p>
          <p>
            Click <strong className="text-emerald-300">"Browse Document"</strong> to select your syllabus file (PDF, DOCX, or Image). Uploading will automatically start parsing and take you to the Verification stage.
          </p>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300/90">
            ⚡ Supported formats: PDF, DOCX, PNG, JPG, JSON files up to 50MB.
          </div>
        </div>
      );
    }

    if (pathname.startsWith('/verification')) {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
            Step 3: Verification & Review
          </p>
          <p>
            Review the extracted units, topics, and generated DAG structure below. Make any necessary edits directly inline.
          </p>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-[11px] text-indigo-300">
            💾 When finished reviewing, click either <strong className="text-indigo-200">"Save"</strong> button (at top or bottom of the page) to persist your syllabus to the database and view it in your repository.
          </div>
        </div>
      );
    }

    if (pathname.startsWith('/syllabus')) {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Library size={14} className="text-amber-400 shrink-0" />
            Syllabus Repository Overview
          </p>
          <p>
            Here are all your saved syllabi. Click on any course to trigger CO-PO mapping, view its hierarchical curriculum tree, or generate a full teaching plan.
          </p>
        </div>
      );
    }

    if (pathname.startsWith('/curriculum')) {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-amber-400 shrink-0" />
            Pedagogies Catalog & Curriculum Tree
          </p>
          <p>
            Browse through <strong>30 active pedagogies</strong> (e.g., Flipped Classroom, Jigsaw, Problem-Based Learning) and assign them to specific topics in your course.
          </p>
        </div>
      );
    }

    if (pathname.startsWith('/timeline')) {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Compass size={14} className="text-amber-400 shrink-0" />
            Teaching Plan & Schedule
          </p>
          <p>
            Review and fine-tune your teaching schedule, topic distribution, and weekly hour allocations generated by backend AI.
          </p>
        </div>
      );
    }

    // Default fallback guidance
    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-300">
        <p className="font-semibold text-slate-100">Academic Strategy & Planning</p>
        <p>
          Use Syllabus AI Studio to map CO-PO matrix, build Bloom's taxonomy assessments, and optimize learning paths.
        </p>
      </div>
    );
  };

  // Target element highlighter logic based on current page
  const handleHighlightAction = () => {
    if (pathname === '/dashboard' || pathname === '/') {
      triggerHighlight('guide-upload-btn');
    } else if (pathname.startsWith('/upload')) {
      if (activeWorkflowStep === 'code_verify') {
        triggerHighlight('guide-course-code-input');
      } else {
        triggerHighlight('guide-upload-zone');
      }
    } else if (pathname.startsWith('/verification')) {
      triggerHighlight('guide-save-btn-top');
    } else if (pathname.startsWith('/syllabus')) {
      triggerHighlight('guide-syllabus-list');
    } else if (pathname.startsWith('/curriculum')) {
      triggerHighlight('guide-pedagogy-catalog');
    } else {
      triggerHighlight('guide-main-content');
    }
  };

  // Target primary CTA link
  const getPrimaryAction = () => {
    if (pathname === '/dashboard' || pathname === '/') {
      return { label: 'Go to Upload Page', href: '/upload', icon: Upload };
    }
    if (pathname.startsWith('/upload')) {
      return { label: 'Go to Verification', href: '/verification', icon: ArrowRight };
    }
    if (pathname.startsWith('/verification')) {
      return { label: 'Open Repository', href: '/syllabus', icon: Library };
    }
    return { label: 'Open Pedagogies Catalog', href: '/curriculum', icon: BookOpen };
  };

  const primaryAction = getPrimaryAction();
  const PrimaryActionIcon = primaryAction.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-auto flex flex-col items-end">
      <AnimatePresence mode="wait">
        {isGuideMinimized ? (
          /* MINIMIZED FLOATING BUBBLE */
          <motion.button
            key="minimized-bubble"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMinimized(false)}
            className={`flex items-center gap-3 rounded-full border ${persona.colorTheme.border} bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl ${persona.colorTheme.glow} cursor-pointer group`}
            title={`Expand ${persona.role}`}
          >
            <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${persona.colorTheme.bg} ${persona.colorTheme.text} border ${persona.colorTheme.border}`}>
              <IconComponent size={18} className="animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                AI GUIDE &bull; {persona.badge}
              </p>
              <p className={`text-xs font-bold ${persona.colorTheme.text} mt-0.5 leading-tight group-hover:underline`}>
                {persona.role}
              </p>
            </div>
            <Maximize2 size={14} className="text-slate-400 group-hover:text-white transition-colors ml-1" />
          </motion.button>
        ) : (
          /* EXPANDED ASSISTANT WIDGET CARD */
          <motion.div
            key="expanded-card"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border ${persona.colorTheme.border} bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-2xl ${persona.colorTheme.glow}`}
          >
            {/* Widget Top Bar Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${persona.colorTheme.bg} ${persona.colorTheme.text} border ${persona.colorTheme.border}`}>
                  <IconComponent size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${persona.colorTheme.bg} ${persona.colorTheme.text} border ${persona.colorTheme.border}`}>
                      {persona.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ONLINE</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                    {persona.role}
                  </h3>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={resetGuide}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  title="Reset Guide"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  title="Minimize Assistant"
                >
                  <Minimize2 size={14} />
                </button>
                <button
                  onClick={() => toggleGuide(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Close Assistant"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Workflow Progress Banner */}
            <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400 mb-1.5">
                <span>INGESTION & PLANNING PIPELINE</span>
                <span>STEP {WORKFLOW_STEPS.findIndex((s) => s.id === activeWorkflowStep) + 1} / 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {WORKFLOW_STEPS.map((step) => {
                  const isActive = activeWorkflowStep === step.id;
                  const stepIndex = step.stepNumber;
                  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.id === activeWorkflowStep) + 1;
                  const isCompleted = stepIndex < currentIdx;

                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setWorkflowStep(step.id);
                        if (pathname !== step.route) {
                          router.push(step.route);
                        }
                      }}
                      className={`truncate rounded-lg px-2 py-1 text-[10px] font-mono transition-all text-center border cursor-pointer ${
                        isActive
                          ? persona.colorTheme.stepActive
                          : isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                      title={step.title}
                    >
                      {step.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guidance Content Area */}
            <div className="p-5 max-h-72 overflow-y-auto">
              {renderGuidanceContent()}
            </div>

            {/* Bottom Action Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/60 px-5 py-3 gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleHighlightAction}
                className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
              >
                <Target size={14} className="mr-1.5 text-cyan-400" />
                Highlight Action
              </Button>

              <Button
                size="sm"
                className={`text-xs font-semibold ${
                  personaKey === 'dashboard'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    : personaKey === 'upload'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : personaKey === 'verification'
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
                asChild
              >
                <Link href={primaryAction.href}>
                  {primaryAction.label} <PrimaryActionIcon size={14} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
