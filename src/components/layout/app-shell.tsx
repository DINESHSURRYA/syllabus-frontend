"use client";
import './styles/app-shell.css';
import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Compass, 
  LayoutGrid, 
  Settings, 
  Sparkles, 
  Upload, 
  Waypoints,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Library,
  FileQuestion,
  Layers,
  Sliders,
  ShieldCheck,
  BarChart3,
  GraduationCap,
  Award,
  GitFork,
  Mic,
  PieChart,
  LayoutDashboard,
  ScrollText,
  FileCode2,
  FileText,
  Stethoscope,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/components/providers/theme-provider';
import { ExtractionNotificationPopup } from '@/components/extraction-notification';
import { GuideAssistantWidget } from '@/components/guide/guide-assistant-widget';
import { useSyllabusStore, useGuideStore } from '@/stores';

// Module 1: Main Studio Navigation Items
const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, leadText: 'Navigate to Main Dashboard' },
  { href: '/upload', label: 'Upload Syllabus', icon: Upload, leadText: 'Open Syllabus Uploader' },
  { href: '/verification', label: 'Verification', icon: Compass, leadText: 'Open Verification Editor' },
  { href: '/syllabus', label: 'Syllabus Repository', icon: Library, leadText: 'Open Syllabus Repository' },
  { href: '/curriculum', label: 'Curriculum Tree', icon: BookOpen, leadText: 'Explore Curriculum Tree' },
  { href: '/timeline', label: 'Timeline', icon: Waypoints, leadText: 'View Teaching Timeline' },
  { href: '/analytics', label: 'Analytics', icon: Sparkles, leadText: 'Open Analytics Dashboard' },
];

// Module 2: MCQ & Assessments Navigation Items
const mcqNavItems = [
  { href: '/mcq/generator', label: 'AI MCQ Generator', icon: FileQuestion, leadText: 'Generate questions with Bloom matrix' },
  { href: '/mcq/bank', label: 'Question Bank & Sets', icon: Layers, leadText: 'Manage question repository & sets' },
  { href: '/assessments/builder', label: 'Assessment Builder', icon: Sliders, leadText: 'Construct formal exams & quizzes' },
  { href: '/assessments/manage', label: 'Security & Management', icon: ShieldCheck, leadText: 'Access control & proctoring' },
  { href: '/assessments/analytics', label: 'Analytics & History', icon: BarChart3, leadText: 'Candidate logs & Bloom metrics' },
  { href: '/exam/portal', label: 'Candidate Portal', icon: GraduationCap, leadText: 'Distraction-free test environment' },
  { href: '/exam/results/attempt-101', label: 'Exam Results Review', icon: Award, leadText: 'Scorecard & Bloom breakdown' },
];

// Module 3: Diagnostic Evaluator Navigation Items
const evaluatorNavItems = [
  { href: '/evaluator', label: 'Assessment Ingestion', icon: GitFork, leadText: 'Select candidate or upload JSON' },
  { href: '/evaluator/interview', label: 'Interactive Interview', icon: Mic, leadText: 'Diagnostic audio-visual interview' },
  { href: '/evaluator/report', label: 'Diagnostic Report', icon: PieChart, leadText: 'Candidate belief & mastery report' },
  { href: '/evaluator/admin', label: 'Session Dashboard', icon: LayoutDashboard, leadText: 'Manage diagnostic candidate sessions' },
  { href: '/evaluator/audit-logs', label: 'LLM Audit Logs', icon: FileCode2, leadText: 'Inspect prompts, JSON & metrics' },
];

// Module 4: Doubts Navigation Items
const doubtsNavItems = [
  { href: '/doubts', label: 'AI Doubts Resolver', icon: HelpCircle, leadText: 'Ask questions & get instant AI explanations' },
  { href: '/doubts/history', label: 'Doubts History', icon: ScrollText, leadText: 'Review past asked questions & solutions' },
  { href: '/doubts/topics', label: 'Topic-wise Q&A', icon: BookOpen, leadText: 'Explore doubts organized by course topic' },
];

type ModuleType = 'studio' | 'mcq' | 'evaluator' | 'doubts';

interface ModuleConfig {
  id: ModuleType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badge: string;
  colorTheme: 'cyan' | 'emerald' | 'indigo' | 'amber';
  defaultHref: string;
  description: string;
  items: Array<{ href: string; label: string; icon: LucideIcon; leadText: string }>;
}

const modules: ModuleConfig[] = [
  {
    id: 'studio',
    label: 'MAIN STUDIO',
    shortLabel: 'Studio',
    icon: LayoutGrid,
    badge: 'CORE',
    colorTheme: 'cyan',
    defaultHref: '/dashboard',
    description: 'Syllabus CRT, Curriculum Tree & Analytics',
    items: mainNavItems
  },
  {
    id: 'mcq',
    label: 'MCQ & ASSESSMENTS',
    shortLabel: 'MCQ',
    icon: FileText,
    badge: 'NEW',
    colorTheme: 'emerald',
    defaultHref: '/mcq/generator',
    description: 'AI MCQ Generator, Bank & Exams',
    items: mcqNavItems
  },
  {
    id: 'evaluator',
    label: 'DIAGNOSTIC EVALUATOR',
    shortLabel: 'Evaluator',
    icon: Stethoscope,
    badge: 'AI',
    colorTheme: 'indigo',
    defaultHref: '/evaluator',
    description: 'Ingestion, Audio Interview & Audit Logs',
    items: evaluatorNavItems
  },
  {
    id: 'doubts',
    label: 'DOUBTS & Q&A',
    shortLabel: 'Doubts',
    icon: HelpCircle,
    badge: 'ASK',
    colorTheme: 'amber',
    defaultHref: '/doubts',
    description: 'AI Doubts Resolver & Subject Q&A',
    items: doubtsNavItems
  }
];

const getModuleFromPath = (pathname: string): ModuleType => {
  if (pathname.startsWith('/mcq') || pathname.startsWith('/assessments') || pathname.startsWith('/exam')) {
    return 'mcq';
  }
  if (pathname.startsWith('/evaluator')) {
    return 'evaluator';
  }
  if (pathname.startsWith('/doubts')) {
    return 'doubts';
  }
  return 'studio';
};

const moduleAccent = {
  studio:    { border: 'border-indigo-500/70',  bg: 'bg-indigo-500/12',  text: 'text-indigo-400',  glow: 'shadow-md', activePill: 'bg-indigo-600 text-white', tabActive: 'bg-indigo-600 text-white border-indigo-700', tabHover: 'hover:bg-indigo-500/15 hover:text-indigo-300' },
  mcq:       { border: 'border-emerald-500/70', bg: 'bg-emerald-500/12', text: 'text-emerald-400', glow: 'shadow-md', activePill: 'bg-emerald-600 text-white', tabActive: 'bg-emerald-600 text-white border-emerald-700', tabHover: 'hover:bg-emerald-500/15 hover:text-emerald-300' },
  evaluator: { border: 'border-indigo-500/70',  bg: 'bg-indigo-500/12',  text: 'text-indigo-400',  glow: 'shadow-md', activePill: 'bg-indigo-600 text-white', tabActive: 'bg-indigo-600 text-white border-indigo-700', tabHover: 'hover:bg-indigo-500/15 hover:text-indigo-300' },
  doubts:    { border: 'border-amber-500/70',   bg: 'bg-amber-500/12',   text: 'text-amber-400',   glow: 'shadow-md', activePill: 'bg-amber-600 text-white', tabActive: 'bg-amber-600 text-white border-amber-700', tabHover: 'hover:bg-amber-500/15 hover:text-amber-300' },
};

// Memoized Sidebar Sub-Component
const SidebarNav = React.memo(function SidebarNav({
  activeModule,
  pathname,
  isCollapsed,
  hoveredNavItem,
  setHoveredNavItem,
  handleModuleClick,
}: {
  activeModule: ModuleType;
  pathname: string;
  isCollapsed: boolean;
  hoveredNavItem: string | null;
  setHoveredNavItem: (item: string | null) => void;
  handleModuleClick: (mod: ModuleConfig) => void;
}) {
  const currentModuleConfig = modules.find((m) => m.id === activeModule) || modules[0];
  const accent = moduleAccent[activeModule];
  const { openSettings } = useTheme();

  return (
    <>
      {/* TOP TAB BAR — horizontal/grid mode switcher */}
      <div className={`shrink-0 pt-3 pb-0 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 ${
        isCollapsed ? 'px-1' : 'px-2'
      }`}>
        <div className={`flex items-center mb-3 ${isCollapsed ? 'justify-center' : 'px-1 gap-2.5'}`}>
          <Link href="/splash" className="group relative flex items-center gap-2" title="SYLLABUS AI Studio Platform">
            <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-400 border border-indigo-500/40 group-hover:border-indigo-400 group-hover:scale-105 transition-all shadow-sm">
              <Cpu size={16} className="text-indigo-400" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-mono font-black text-[var(--text-accent)] uppercase tracking-wider">SYLLABUS AI</span>
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Studio Platform</span>
              </div>
            )}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[var(--bg-card)]" />
            </span>
          </Link>
        </div>

        {isCollapsed ? (
          <div className="grid grid-cols-2 gap-1 pb-2 w-full justify-items-center">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              const a = moduleAccent[mod.id];

              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? `${a.text} bg-[var(--bg-card)] ${a.tabActive} shadow-sm z-10`
                      : `text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]`
                  }`}
                  aria-label={`Switch to ${mod.label}`}
                  title={`${mod.label}: ${mod.description}`}
                >
                  <Icon size={15} className="shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 pb-1 w-full">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              const a = moduleAccent[mod.id];

              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className={`relative w-full flex flex-col items-center justify-center gap-1 px-1 py-1.5 rounded-t-xl text-[10px] font-mono font-bold uppercase tracking-tighter transition-all duration-200 cursor-pointer text-center min-w-0 ${
                    isActive
                      ? `${a.text} bg-[var(--bg-card)] ${a.tabActive} border-t border-x border-b-0 shadow-sm z-10`
                      : `text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]`
                  }`}
                  aria-label={`Switch to ${mod.label}`}
                  title={mod.description}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className={`absolute top-0 left-1 right-1 h-[2px] rounded-full ${a.activePill}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon size={14} className="shrink-0" />
                  <span className="w-full text-center text-[10px] font-bold leading-tight whitespace-nowrap overflow-visible">
                    {mod.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MODULE HEADER */}
      {isCollapsed ? (
        <div className="py-2 px-2 flex justify-center shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <span className={`w-8 h-1 rounded-full ${
            activeModule === 'studio' ? 'bg-indigo-500' :
            activeModule === 'mcq' ? 'bg-emerald-500' :
            activeModule === 'evaluator' ? 'bg-indigo-500' : 'bg-amber-500'
          }`} title={`${currentModuleConfig.label} Active - ${currentModuleConfig.description}`} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule + '-header'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="px-4 py-2.5 flex items-center justify-between shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]"
          >
            <p className={`text-[10px] font-mono font-semibold truncate ${accent.text} opacity-90`}>
              {currentModuleConfig.description}
            </p>
            <span className={`ml-2 shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
              activeModule === 'studio'
                ? 'bg-[#1e40af] text-white border-blue-700'
                : activeModule === 'mcq'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : activeModule === 'evaluator'
                ? 'bg-indigo-800 text-white border-indigo-700'
                : 'bg-amber-800 text-white border-amber-700'
            }`}>
              {currentModuleConfig.badge}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* NAV ITEMS */}
      <AnimatePresence mode="wait">
        <motion.nav
          key={activeModule + '-nav'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`flex-1 overflow-y-auto overflow-x-hidden custom-sidebar-scrollbar ${
            isCollapsed ? 'px-1.5 py-2 space-y-1.5 flex flex-col items-center' : 'px-3 py-2 space-y-0.5'
          }`}
        >
          {currentModuleConfig.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href ||
                           (item.href.includes('/exam/results') && pathname.startsWith('/exam/results')) ||
                           (item.href.includes('/evaluator/report') && pathname.startsWith('/evaluator/report')) ||
                           (item.href.includes('/evaluator/admin/transcript') && pathname.startsWith('/evaluator/admin/transcript'));
            const isHovered = hoveredNavItem === item.href;

            if (isCollapsed) {
              return (
                <div key={item.href} className="w-full flex justify-center">
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHoveredNavItem(item.href)}
                    onMouseLeave={() => setHoveredNavItem(null)}
                    title={`${item.label} — ${item.leadText}`}
                    className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 border ${
                      active
                        ? 'border-[#1d4ed8] bg-[#1e40af] text-white font-bold shadow-md'
                        : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId={`activeNavPill-${activeModule}`}
                        className="absolute -left-1.5 w-1 h-5 rounded-r-full bg-white shadow-xs"
                      />
                    )}
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                      }`}
                    />
                  </Link>
                </div>
              );
            }

            return (
              <div key={item.href} className="w-full">
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredNavItem(item.href)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  title={item.leadText}
                  className={`group flex flex-col gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border ${
                    active
                      ? 'border-[#1d4ed8] bg-[#1e40af] text-white font-bold shadow-md'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full relative">
                    {active && (
                      <motion.div
                        layoutId={`activeNavPill-${activeModule}`}
                        className="absolute -left-3 w-1 h-5 rounded-r-full bg-white shadow-xs"
                      />
                    )}
                    <Icon
                      size={15}
                      className={`shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                      }`}
                    />
                    <span className="truncate flex-1 font-semibold text-xs">{item.label}</span>
                  </div>
                  <p className={`text-[10px] font-mono pl-[23px] truncate transition-all duration-150 ${
                    active
                      ? 'text-blue-100 font-medium'
                      : isHovered
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] opacity-75'
                  }`}>
                    {item.leadText}
                  </p>
                </Link>
              </div>
            );
          })}
        </motion.nav>
      </AnimatePresence>

      {/* UTILITIES */}
      <div className={`p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 shrink-0 ${
        isCollapsed ? 'flex flex-col items-center gap-2 px-1' : 'space-y-2'
      }`}>
        {!isCollapsed && (
          <p className="px-1 text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
            UTILITIES &amp; PREFERENCES
          </p>
        )}

        <button
          onClick={openSettings}
          className={`flex items-center gap-2.5 rounded-xl border transition-all cursor-pointer ${
            isCollapsed
              ? 'w-11 h-11 justify-center'
              : 'w-full px-3 py-2 text-xs font-semibold'
          } ${
            pathname === '/settings'
              ? 'border-[#1d4ed8] bg-[#1e40af] text-white font-bold shadow-md'
              : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
          }`}
          title="Appearance & Preference Settings"
        >
          <Settings size={isCollapsed ? 18 : 16} className={`shrink-0 ${pathname === '/settings' ? 'text-white' : 'text-[var(--text-muted)]'}`} />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </button>

        <div className={isCollapsed ? "pt-0 w-full flex justify-center" : "pt-1"}>
          <ThemeToggle isCollapsed={isCollapsed} className="w-full" />
        </div>
      </div>
    </>
  );
});

// Memoized Header Sub-Component
const HeaderBar = React.memo(function HeaderBar({
  activeModule,
  isGuideEnabled,
  toggleGuide,
  setMinimized,
}: {
  activeModule: ModuleType;
  isGuideEnabled: boolean;
  toggleGuide: (enabled?: boolean) => void;
  setMinimized: (v: boolean) => void;
}) {
  const currentModuleConfig = modules.find((m) => m.id === activeModule) || modules[0];
  const accent = moduleAccent[activeModule];

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/splash" className="flex items-center gap-2 group hover:opacity-90 transition-all cursor-pointer" title="Open Splash Page">
          <div className="rounded-lg bg-indigo-500/15 p-1.5 text-indigo-400 border border-indigo-500/40 group-hover:border-indigo-400 group-hover:scale-105 transition-all shadow-sm">
            <Cpu size={15} className="text-indigo-400" />
          </div>
          <span className="text-xs font-mono font-black text-[var(--text-accent)] uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
            Syllabus AI
          </span>
        </Link>
        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
            activeModule === 'studio'
              ? 'border-blue-700 bg-[#1e40af] text-white'
              : activeModule === 'mcq'
              ? 'border-emerald-700 bg-emerald-800 text-white'
              : 'border-indigo-700 bg-indigo-800 text-white'
          }`}>
            {currentModuleConfig.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (!isGuideEnabled) {
              toggleGuide(true);
            }
            setMinimized(false);
          }}
          className={`relative rounded-2xl border px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isGuideEnabled
              ? 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10 shadow-sm'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
          title="Toggle Interactive AI Guide"
        >
          <Sparkles size={14} className={isGuideEnabled ? "text-indigo-400 animate-pulse" : ""} />
          <span className="hidden sm:inline font-mono">AI Guide</span>
        </button>

        <Link
          href="/profile"
          className="hidden sm:flex items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1.5 hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)] transition-all group cursor-pointer"
          title="Open Curriculum Admin Profile"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm group-hover:scale-105 transition-transform">
            AI
          </div>
          <div className="text-xs">
            <p className="font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--text-accent)] transition-colors">
              Curriculum Admin
            </p>
            <p className={`text-[10px] font-mono ${accent.text}`}>
              {currentModuleConfig.shortLabel.toUpperCase()} ACTIVE
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
});

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeModule, setActiveModule] = useState<ModuleType>(() => getModuleFromPath(pathname));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [isToggleHovered, setIsToggleHovered] = useState(false);

  const { activeNotification, isBackgroundProcessing } = useSyllabusStore();
  const { isGuideEnabled, toggleGuide, setMinimized } = useGuideStore();

  useEffect(() => {
    const detectedModule = getModuleFromPath(pathname);
    setActiveModule(detectedModule);
  }, [pathname]);

  const handleModuleClick = (mod: ModuleConfig) => {
    setActiveModule(mod.id);

    const isCurrentRouteInModule = mod.items.some((item) => {
      if (item.href.includes('/[') || item.href.includes('attempt-101') || item.href.includes('thread-101')) {
        const basePath = item.href.split('/')[1];
        return pathname.startsWith(`/${basePath}`);
      }
      return pathname === item.href || pathname.startsWith(item.href);
    });

    if (!isCurrentRouteInModule) {
      router.push(mod.defaultHref);
    }
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-[280px]';

  return (
    <div className="min-h-screen w-full font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200 flex overflow-x-hidden">
      <aside
        className={`fixed top-0 left-0 bottom-0 h-screen z-50 bg-[var(--bg-card)]/95 backdrop-blur-xl border-r border-[var(--border-subtle)] flex flex-col transition-all duration-300 ease-in-out shadow-xl overflow-visible ${sidebarWidth}`}
      >
        <SidebarNav
          activeModule={activeModule}
          pathname={pathname}
          isCollapsed={isCollapsed}
          hoveredNavItem={hoveredNavItem}
          setHoveredNavItem={setHoveredNavItem}
          handleModuleClick={handleModuleClick}
        />

        <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 overflow-visible">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            onMouseEnter={() => setIsToggleHovered(true)}
            onMouseLeave={() => setIsToggleHovered(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-500/40 bg-slate-900 text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-sm transition-all cursor-pointer focus:outline-none"
            title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            aria-label={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <AnimatePresence>
            {isToggleHovered && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-xl border border-indigo-500/40 bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-indigo-300 shadow-xl backdrop-blur-xl pointer-events-none"
              >
                {isCollapsed ? 'Expand Sidebar Layout \u2192' : 'Collapse Sidebar Layout \u2190'}
                <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-indigo-500/40 bg-slate-950" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'pl-20' : 'pl-[280px]'
        }`}
      >
        <HeaderBar
          activeModule={activeModule}
          isGuideEnabled={isGuideEnabled}
          toggleGuide={toggleGuide}
          setMinimized={setMinimized}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 ease-in-out">
          {children}
        </main>
        <ExtractionNotificationPopup />
        <GuideAssistantWidget />
      </div>
    </div>
  );
}

// Alias for MainLayout compatibility
export const MainLayout = AppShell;