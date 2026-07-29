"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, Theme, FontSize, FontFamily } from '@/components/providers/theme-provider';
import { Settings, Sun, Moon, Eye, Type, Sliders, X, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModalOverlay({ isOpen, onClose }: SettingsModalProps) {
  const { 
    theme, 
    fontSize, 
    fontSizePx, 
    fontFamily, 
    setTheme, 
    setFontSize, 
    setFontSizePx, 
    setFontFamily 
  } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl space-y-6 text-[var(--text-primary)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                  Appearance &amp; Preference Settings
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Customize theme, font family, and scale across all pages.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Close Settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section 1: Theme Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Sun size={14} className="text-amber-500" /> Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark' as Theme, label: 'Dark', icon: Moon, desc: 'High Contrast' },
                { id: 'light' as Theme, label: 'Light', icon: Sun, desc: 'Clean Light' },
                { id: 'eyecomfort' as Theme, label: 'Comfort', icon: Eye, desc: 'Warm Amber' }
              ].map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <Icon size={18} className="mb-1" />
                    <span>{t.label}</span>
                    <span className="text-[9px] font-normal opacity-70">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Font Family Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Type size={14} className="text-amber-500" /> Font Family
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sans' as FontFamily, label: 'Sans-Serif', style: 'font-sans' },
                { id: 'serif' as FontFamily, label: 'Serif', style: 'font-serif' },
                { id: 'mono' as FontFamily, label: 'Monospace', style: 'font-mono' }
              ].map((f) => {
                const isActive = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFontFamily(f.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${f.style} ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Font Size Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-amber-500" /> Font Scale ({fontSizePx}px)
              </label>
              <span className="text-xs font-semibold text-amber-500 uppercase">{fontSize}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'small' as FontSize, label: 'Small (14px)', px: 14 },
                { id: 'medium' as FontSize, label: 'Medium (16px)', px: 16 },
                { id: 'large' as FontSize, label: 'Large (18px)', px: 18 }
              ].map((s) => {
                const isActive = fontSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setFontSize(s.id)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={12}
              max={22}
              step={1}
              value={fontSizePx}
              onChange={(e) => setFontSizePx(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Live Preview</div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Syllabus AI Doubts Resolver &amp; Topic-wise Q&amp;A platform.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs shadow-lg transition-transform transform active:scale-95"
            >
              Apply &amp; Save Preferences
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
