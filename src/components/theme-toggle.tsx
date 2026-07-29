"use client";
import './styles/theme-toggle.css';
import React, { useState } from 'react';
import { Sun, Moon, Shield, Eye } from 'lucide-react';
import { useTheme, Theme } from '@/components/providers/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle({ 
  className = '', 
  isCollapsed = false 
}: { 
  className?: string; 
  isCollapsed?: boolean;
}) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const themeConfig: Record<Theme, { label: string; subtext: string; icon: React.ComponentType<any>; iconColor: string; activeColor: string }> = {
    dark: {
      label: 'DARK MODE',
      subtext: 'High-Contrast Dark Slate',
      icon: Moon,
      iconColor: 'text-indigo-400',
      activeColor: 'bg-indigo-600 text-white shadow-md',
    },
    light: {
      label: 'LIGHT MODE',
      subtext: 'High-Visibility Light',
      icon: Sun,
      iconColor: 'text-amber-500',
      activeColor: 'bg-indigo-600 text-white shadow-md',
    },
    eyecomfort: {
      label: 'EYE COMFORT',
      subtext: 'Warm Low-Blue Protection',
      icon: Eye,
      iconColor: 'text-amber-400',
      activeColor: 'bg-amber-500 text-black shadow-md',
    },
  };

  const currentConfig = themeConfig[theme] || themeConfig.dark;

  const getNextThemeInfo = () => {
    if (theme === 'dark') return { name: 'Light Mode ☀️', next: 'light' as Theme };
    if (theme === 'light') return { name: 'Eye Comfort Mode 👁️', next: 'eyecomfort' as Theme };
    return { name: 'Dark Mode 🌙', next: 'dark' as Theme };
  };

  const nextInfo = getNextThemeInfo();

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Non-Clipping Floating Hover Tooltip */}
      <AnimatePresence>
        {hoveredOption && (
          <motion.div
            initial={{ opacity: 0, y: isCollapsed ? 0 : 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCollapsed ? 0 : 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 pointer-events-none whitespace-nowrap rounded-xl border border-amber-500/40 bg-slate-950 px-3.5 py-2 text-xs font-mono font-bold text-amber-300 shadow-xl backdrop-blur-xl flex items-center gap-2 ${
              isCollapsed
                ? 'left-full ml-3 top-1/2 -translate-y-1/2'
                : 'bottom-full mb-2.5 left-1/2 -translate-x-1/2'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
              THEME
            </span>
            <span>{hoveredOption}</span>
            {/* Pointer arrow */}
            <div
              className={`absolute w-2 h-2 rotate-45 border-amber-500/40 bg-slate-950 ${
                isCollapsed
                  ? '-left-1 top-1/2 -translate-y-1/2 border-l border-b'
                  : '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!isCollapsed ? (
        /* 3-Option Segment Selector for Full Sidebar View */
        <div className={`w-full flex flex-col gap-1.5 p-2 rounded-2xl border transition-all duration-300 bg-[var(--bg-subtle)] border-[var(--border-subtle)] ${className}`}>
          <div className="flex items-center justify-between px-1 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Theme Options</span>
            <span className="text-[var(--text-accent)]">{theme.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {(['dark', 'light', 'eyecomfort'] as Theme[]).map((t) => {
              const cfg = themeConfig[t];
              const Icon = cfg.icon;
              const isActive = theme === t;

              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  onMouseEnter={() => setHoveredOption(`Switch to ${cfg.label} (${cfg.subtext})`)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? cfg.activeColor
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                  title={`Switch to ${cfg.label}`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? '' : cfg.iconColor}`} />
                  <span className="text-[9px] uppercase tracking-tighter truncate w-full text-center">
                    {t === 'eyecomfort' ? 'Comfort' : t}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Collapsed Single Button Icon Toggle - Cycles through all 3 options */
        <button
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredOption(`Cycle Theme (Next: ${nextInfo.name})`)}
          onMouseLeave={() => setHoveredOption(null)}
          title={`Cycle Theme (Next: ${nextInfo.name})`}
          aria-label={`Cycle Theme (Next: ${nextInfo.name})`}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
            theme === 'eyecomfort'
              ? 'border-amber-500/50 bg-amber-950/40 text-amber-400 shadow-sm'
              : theme === 'dark'
              ? 'border-indigo-500/40 bg-slate-900 text-indigo-300 shadow-sm'
              : 'border-indigo-300 bg-white text-indigo-700 shadow-md'
          } ${className}`}
        >
          <motion.div
            key={theme}
            initial={{ scale: 0.8, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
          >
            {theme === 'eyecomfort' ? (
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </motion.div>
        </button>
      )}
    </div>
  );
}
