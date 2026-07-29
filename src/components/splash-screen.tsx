"use client";
import './styles/splash-screen.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

function RouteTooltip({
  destination,
  description,
  position = 'bottom',
  align = 'center',
  isVisible,
  isDark,
}: {
  destination: string;
  description: string;
  position?: 'top' | 'bottom';
  align?: 'center' | 'right' | 'left';
  isVisible: boolean;
  isDark: boolean;
}) {
  const positionClasses = position === 'bottom' 
    ? 'top-full mt-2.5' 
    : 'bottom-full mb-2.5';

  const alignClasses = align === 'right' 
    ? 'right-0' 
    : align === 'left' 
    ? 'left-0' 
    : 'left-1/2 -translate-x-1/2';

  const arrowClasses = position === 'bottom'
    ? '-top-1 border-l border-t'
    : '-bottom-1 border-r border-b';

  const arrowAlign = align === 'right'
    ? 'right-6'
    : align === 'left'
    ? 'left-6'
    : 'left-1/2 -translate-x-1/2';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? -4 : 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'bottom' ? -4 : 4, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`absolute ${positionClasses} ${alignClasses} z-50 pointer-events-none whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-mono shadow-xl backdrop-blur-md flex flex-col gap-1 ${
            isDark
              ? 'border-indigo-500/50 bg-slate-950/95 text-indigo-200 shadow-xl'
              : 'border-indigo-300 bg-white/95 text-slate-800 shadow-[0_10px_25px_rgba(79,70,229,0.18)]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase ${
              isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}>
              LEADS TO
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {destination}
            </span>
          </div>
          <span className={`text-[11px] font-sans font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {description}
          </span>
          <div className={`absolute ${arrowAlign} ${arrowClasses} w-2 h-2 rotate-45 ${
            isDark ? 'border-indigo-500/50 bg-slate-950' : 'border-indigo-300 bg-white'
          }`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SplashScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-300 overflow-hidden font-sans selection:bg-indigo-600 selection:text-white flex flex-col justify-between ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sleek Modern Gradient Mesh Background */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${
        isDark ? 'opacity-40' : 'opacity-30'
      }`}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-[120px]" />
      </div>

      {/* High-Contrast Overlay Layer & Radial Vignette */}
      <div className={`absolute inset-0 z-1 pointer-events-none transition-all duration-300 ${
        isDark
          ? 'bg-black/60 backdrop-blur-[2px] bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0.4)_0%,rgba(2,6,23,0.95)_100%)]'
          : 'bg-white/40 backdrop-blur-[2px] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.4)_0%,rgba(248,250,252,0.95)_100%)]'
      }`} />

      {/* Top Header HUD Bar */}
      <header className={`relative z-20 flex items-center justify-between px-6 py-5 border-b transition-colors duration-300 backdrop-blur-xl ${
        isDark
          ? 'border-indigo-500/20 bg-slate-950/90'
          : 'border-slate-200/80 bg-white/85 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl border shadow-sm ${
            isDark
              ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm'
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <Cpu className={`w-5 h-5 animate-pulse ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-500">● FRONTEND ONLINE</span>
              <span className={`text-xs ${isDark ? 'opacity-40 text-white' : 'opacity-40 text-slate-900'}`}>|</span>
              <span className={`text-xs font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                HIGH-CONTRAST ACCESSIBLE MATRIX
              </span>
            </div>
            <h2 className={`text-sm font-bold tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              SYLLABUS AI STUDIO
            </h2>
          </div>
        </div>

        {/* Quick Navigation & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle isCollapsed />
          <div 
            className="relative"
            onMouseEnter={() => setHoveredButton('header-dashboard')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Link href="/dashboard">
              <Button
                size="sm"
                className={`font-bold rounded-xl text-xs flex items-center gap-1 shadow-md ${
                  isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                Open Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
            <RouteTooltip
              destination="/dashboard"
              description="Opens Main Syllabus AI Studio Dashboard"
              position="bottom"
              align="right"
              isVisible={hoveredButton === 'header-dashboard'}
              isDark={isDark}
            />
          </div>
        </div>
      </header>

      {/* Main Hero & CRT Content Area */}
      <main className="relative z-20 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-12 text-center my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl w-full flex flex-col items-center"
        >
          {/* High-Contrast Hero Card Panel */}
          <div className={`w-full rounded-[32px] border p-8 sm:p-12 backdrop-blur-2xl transition-all duration-300 flex flex-col items-center ${
            isDark
              ? 'border-indigo-500/30 bg-slate-950/90 text-white shadow-2xl'
              : 'border-indigo-200/80 bg-white/90 text-slate-900 shadow-xl'
          }`}>
            {/* Cyber Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-xl mb-6 transition-colors duration-300 ${
              isDark
                ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200 shadow-sm'
                : 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
            }`}>
              <Sparkles className={`w-4 h-4 animate-spin splash-spin-4s ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
              <span className="text-xs font-mono font-bold tracking-widest uppercase">AI-POWERED CURRICULUM FRONTEND</span>
            </div>

            {/* MAIN FRONTEND TITLE */}
            <div className="relative my-2 group">
              <h1 className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase select-none ${
                isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}>
                FRONTEND
              </h1>
              <p className={`text-xl sm:text-2xl font-mono font-bold tracking-widest uppercase mt-2 ${
                isDark ? 'text-indigo-300' : 'text-indigo-600'
              }`}>
                SYLLABUS AI PROCESSING MATRIX
              </p>
            </div>

            {/* Subtitle */}
            <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed font-sans font-medium ${
              isDark ? 'text-slate-100' : 'text-slate-600'
            }`}>
              Transform raw syllabus PDFs and text into structured curriculum graphs, teaching timelines, and bloom taxonomy analytics.
            </p>

            {/* Primary Action CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <div 
                className="relative"
                onMouseEnter={() => setHoveredButton('upload')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Button
                  onClick={() => router.push('/upload')}
                  size="lg"
                  className={`font-bold px-8 py-6 rounded-2xl text-base group ${
                    isDark
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  }`}
                >
                  Upload Syllabus <Zap size={18} className="ml-2 group-hover:scale-125 transition-transform" />
                </Button>
                <RouteTooltip
                  destination="/upload"
                  description="Upload syllabus PDFs & text to extract topic graphs"
                  position="bottom"
                  align="center"
                  isVisible={hoveredButton === 'upload'}
                  isDark={isDark}
                />
              </div>

              <div 
                className="relative"
                onMouseEnter={() => setHoveredButton('dashboard')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="lg"
                  className={`font-bold px-8 py-6 rounded-2xl text-base backdrop-blur-md ${
                    isDark
                      ? 'border-indigo-500/40 bg-slate-900/90 hover:bg-indigo-500/20 text-indigo-200'
                      : 'border-slate-300 bg-white/90 hover:bg-slate-100 text-slate-800 shadow-sm'
                  }`}
                >
                  Explore Dashboard <ArrowRight size={18} className="ml-2" />
                </Button>
                <RouteTooltip
                  destination="/dashboard"
                  description="Explore interactive curriculum timelines & analytics"
                  position="bottom"
                  align="center"
                  isVisible={hoveredButton === 'dashboard'}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={`relative z-20 py-4 text-center font-mono text-xs border-t transition-colors duration-300 backdrop-blur-md ${
        isDark
          ? 'border-indigo-500/20 bg-slate-950/90 text-slate-300'
          : 'border-slate-200 bg-white/85 text-slate-600'
      }`}>
        FRONTEND STUDIO — SYLLABUS AI PLATFORM
      </footer>
    </div>
  );
}
