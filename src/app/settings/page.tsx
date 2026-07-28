"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Type, TypeIcon as FontIcon, Eye, Sun, Check, Wand2, CheckCircle2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme, FontSize, FontFamily } from '@/components/providers/theme-provider';
import { useGuideStore } from '@/lib/guide-store';
import { BrainCircuit, Cpu, ShieldCheck, GraduationCap, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const { theme, fontSize, fontSizePx, fontFamily, setTheme, setFontSize, setFontSizePx, setFontFamily } = useTheme();
  const { isGuideEnabled, toggleGuide, resetGuide } = useGuideStore();

  // Selected font for live preview before spreading
  const [previewFont, setPreviewFont] = useState<FontFamily>('sans');
  const [spreadSuccess, setSpreadSuccess] = useState(false);

  // Interactive local font size slider/input state
  const [tempFontSizePx, setTempFontSizePx] = useState<number>(fontSizePx || 16);
  const [fontSizeSuccess, setFontSizeSuccess] = useState(false);

  useEffect(() => {
    if (fontFamily) {
      setPreviewFont(fontFamily);
    }
  }, [fontFamily]);

  useEffect(() => {
    if (fontSizePx) {
      setTempFontSizePx(fontSizePx);
    }
  }, [fontSizePx]);

  const handleApplyFontSize = () => {
    setFontSizePx(tempFontSizePx);
    setFontSizeSuccess(true);
    toast.success(`Font size updated globally to ${tempFontSizePx}px.`);
    setTimeout(() => setFontSizeSuccess(false), 2500);
  };

  const fontOptions: Record<FontFamily, {
    name: string;
    category: string;
    cssClass: string;
    style: React.CSSProperties;
    description: string;
    badgeBg: string;
    activeBorder: string;
  }> = {
    sans: {
      name: 'Inter Standard',
      category: 'Sans-Serif',
      cssClass: 'font-sans',
      style: { fontFamily: 'var(--font-inter), "Inter", sans-serif' },
      description: 'Modern, highly legible geometric sans-serif font designed for digital user interfaces and clean syllabus navigation.',
      badgeBg: 'bg-indigo-600',
      activeBorder: 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500',
    },
    serif: {
      name: 'Merriweather Serif',
      category: 'Serif',
      cssClass: 'font-serif',
      style: { fontFamily: 'var(--font-merriweather), "Merriweather", serif' },
      description: 'Classic editorial serif typography offering high legibility and academic textbook aesthetics for long syllabus readings.',
      badgeBg: 'bg-amber-600',
      activeBorder: 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500',
    },
    mono: {
      name: 'JetBrains Mono',
      category: 'Monospace',
      cssClass: 'font-mono',
      style: { fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace' },
      description: 'Developer-focused monospaced font tailored for reading code algorithms, data structure schemas, and structured units.',
      badgeBg: 'bg-cyan-600',
      activeBorder: 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500',
    },
  };

  const handleSpreadTypography = () => {
    setFontFamily(previewFont);
    setSpreadSuccess(true);
    toast.success(`Typography spread applied! Entire workspace content updated to ${fontOptions[previewFont].name}.`);
    setTimeout(() => setSpreadSuccess(false), 3000);
  };

  const currentPreview = fontOptions[previewFont] || fontOptions.sans;

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.section 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 backdrop-blur-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono text-indigo-600 dark:text-cyan-300 font-semibold">
                <Sparkles size={14} /> System Preferences
              </div>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Configure your Frontend Studio Experience
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Personalize accessibility contrast, font sizes, and typography style across the entire platform.
              </p>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Theme & Contrast Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <CardHeader className="p-6 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Appearance Theme & Contrast Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-medium text-[var(--text-secondary)] shadow-sm leading-relaxed">
                Currently active: <strong className="uppercase font-mono text-indigo-600 dark:text-cyan-400">{theme} MODE</strong>. Select from Cyberpunk Dark Mode, High-Contrast Light Mode, or Warm Sepia Eye Protection.
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setTheme('dark')} 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  className={`font-semibold ${theme === 'dark' ? 'bg-indigo-600 text-white' : ''}`}
                >
                  🌙 Cyberpunk Dark
                </Button>
                <Button 
                  onClick={() => setTheme('light')} 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  className={`font-semibold ${theme === 'light' ? 'bg-indigo-600 text-white' : ''}`}
                >
                  ☀️ High-Contrast Light
                </Button>
                <Button 
                  onClick={() => setTheme('eyecomfort')} 
                  variant={theme === 'eyecomfort' ? 'default' : 'outline'} 
                  className={`font-semibold text-amber-500 border-amber-500/30 ${theme === 'eyecomfort' ? 'bg-amber-600 text-white border-none' : ''}`}
                >
                  👁️ Eye Protection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guided User Persona & AI Assistant Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)] col-span-full">
            <CardHeader className="p-6 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-xl font-bold text-[var(--text-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Guided User Persona &amp; AI Assistant Workflow
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                    isGuideEnabled ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}>
                    {isGuideEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Persistent Onboarding Assistant &amp; Dynamic Persona Guidance
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                    Provides step-by-step guidance across Dashboard, Upload, Verification, and Downstream Curriculum planning. Automatically highlights next actions on each page.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      toggleGuide();
                      toast.success(isGuideEnabled ? 'AI Guide Assistant Muted.' : 'AI Guide Assistant Enabled!');
                    }}
                    variant={isGuideEnabled ? 'default' : 'outline'}
                    className={`font-mono text-xs font-bold ${
                      isGuideEnabled ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''
                    }`}
                  >
                    {isGuideEnabled ? 'Mute AI Assistant' : 'Enable AI Assistant'}
                  </Button>
                  <Button
                    onClick={() => {
                      resetGuide();
                      toast.success('Guide workflow reset to Step 1 (Code Verification).');
                    }}
                    variant="outline"
                    className="border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs"
                  >
                    <RotateCcw size={14} className="mr-1" /> Reset Tutorial
                  </Button>
                </div>
              </div>

              {/* Persona Overview Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
                    <BrainCircuit size={16} /> Curriculum Planner
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Active on Dashboard. Welcomes users and points to Upload Syllabus, Recommended Actions, &amp; 30 Pedagogies Catalog.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                    <Cpu size={16} /> Ingestion Assistant
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Active on Upload page. Directs Course Code Verification pre-flight check, Browse Document upload, &amp; duplicate alerts.
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-mono">
                    <ShieldCheck size={16} /> AI Extraction Auditor
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Active on Verification page. Monitors extraction progress, guides inline unit/topic review, &amp; prompts dual save options.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                    <GraduationCap size={16} /> Academic Strategist
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Active on Syllabus Repository &amp; Downstream views. Guides CO-PO mapping, curriculum trees, &amp; teaching timelines.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Font Size Settings Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <CardHeader className="p-6 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-xl font-bold text-[var(--text-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-indigo-500" />
                  Advanced Font Size Settings
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Text-Only Scaling
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-medium text-[var(--text-secondary)] shadow-sm leading-relaxed">
                Adjust text font size globally without altering layout dimensions, paddings, or container sizes. Active: <strong className="font-mono text-indigo-600 dark:text-cyan-400">{fontSizePx || 16}px</strong>.
              </div>

              {/* Interactive Control Bar: Slider + Synchronized Numeric Input Box */}
              <div className="space-y-3 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider">
                    Font Size Control Level
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--text-secondary)] font-bold">Px Value:</span>
                    <input
                      type="number"
                      min={12}
                      max={24}
                      value={tempFontSizePx}
                      onChange={(e) => setTempFontSizePx(Math.max(12, Math.min(24, parseInt(e.target.value, 10) || 16)))}
                      className="w-16 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-mono font-extrabold text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[var(--text-muted)]">12px</span>
                  <input
                    type="range"
                    min={12}
                    max={24}
                    step={1}
                    value={tempFontSizePx}
                    onChange={(e) => setTempFontSizePx(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 rounded-lg bg-[var(--bg-muted)] accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[var(--text-muted)]">24px</span>
                </div>
              </div>

              {/* Live Text Preview Component */}
              <div className="p-4 rounded-2xl border border-indigo-500/30 bg-[var(--bg-subtle)] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
                  <span>LIVE TEXT PREVIEW ({tempFontSizePx}px)</span>
                  {tempFontSizePx !== fontSizePx && (
                    <span className="text-amber-400 font-bold">Unsaved changes</span>
                  )}
                </div>
                <p 
                  className="font-sans text-[var(--text-primary)] transition-all leading-relaxed"
                  style={{ fontSize: `${tempFontSizePx}px` }}
                >
                  &ldquo;The quick brown fox jumps over the lazy dog. Course Learning Outcome: Master data structure abstractions and algorithmic efficiency.&rdquo;
                </p>
              </div>

              {/* Set / Apply Action Button */}
              <Button
                onClick={handleApplyFontSize}
                className={`w-full font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-white cursor-pointer ${
                  fontSizeSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {fontSizeSuccess ? (
                  <>
                    <CheckCircle2 size={16} /> Font Size Applied Globally ({fontSizePx}px)
                  </>
                ) : (
                  <>
                    <Check size={16} /> Set / Apply Font Size ({tempFontSizePx}px)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Typography Selector Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)] xl:col-span-2 shadow-xl">
            <CardHeader className="p-6 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FontIcon className="w-5 h-5 text-cyan-500" />
                  Typography Selector (3 Font Families)
                </CardTitle>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Click any of the 3 fonts to test live preview, then click <strong className="text-cyan-400">&ldquo;Spread Typography&rdquo;</strong> to apply it to the entire platform content.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Active Workspace:</span>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                  {fontOptions[fontFamily]?.name || fontFamily}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-medium text-[var(--text-secondary)] shadow-sm leading-relaxed flex items-center justify-between flex-wrap gap-3">
                <div>
                  Select typography below. Currently previewing: <strong className="uppercase font-mono text-indigo-600 dark:text-cyan-400">{fontOptions[previewFont]?.name}</strong>.
                </div>
                {fontFamily !== previewFont && (
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                    ⚠️ Preview modified — Click Spread to apply globally
                  </span>
                )}
              </div>

              {/* 3 Font Family Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['sans', 'serif', 'mono'] as FontFamily[]).map((familyKey) => {
                  const opt = fontOptions[familyKey];
                  const isPreviewSelected = previewFont === familyKey;
                  const isGloballySpread = fontFamily === familyKey;

                  return (
                    <div
                      key={familyKey}
                      onClick={() => setPreviewFont(familyKey)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all relative overflow-hidden ${
                        isPreviewSelected
                          ? opt.activeBorder
                          : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-white ${opt.badgeBg}`}>
                          {opt.category}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          {isGloballySpread && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                              <Check size={11} /> SPREAD & ACTIVE
                            </span>
                          )}
                          {isPreviewSelected && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              PREVIEWING
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className={`text-lg font-bold text-[var(--text-primary)] ${opt.cssClass}`} style={opt.style}>
                        {opt.name}
                      </h4>
                      <p className={`text-xs text-[var(--text-secondary)] mt-2 leading-relaxed ${opt.cssClass}`} style={opt.style}>
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Live Typography & Font Size Preview Section */}
              <div className="p-6 rounded-2xl border border-indigo-500/30 bg-[var(--bg-card)] space-y-4 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3">
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} /> LIVE TYPOGRAPHY & FONT SIZE PREVIEW:
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    Showing preview for: <strong className="text-white" style={currentPreview.style}>{currentPreview.name}</strong>
                  </span>
                </div>

                {/* Styled Sample Text updating dynamically with chosen previewFont */}
                <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <h3 className={`text-lg font-extrabold text-[var(--text-primary)] ${currentPreview.cssClass}`} style={currentPreview.style}>
                    Unit 1: Data Structures and Algorithmic Complexity
                  </h3>
                  <p className={`text-sm text-[var(--text-primary)] leading-relaxed ${currentPreview.cssClass}`} style={currentPreview.style}>
                    &ldquo;Students analyze linear array structures, asymptotic complexity metrics (Big-O notation), and memory layout strategies using active pedagogy recommendations.&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 ${currentPreview.cssClass}`} style={currentPreview.style}>
                      Bloom&apos;s Taxonomy: Analyze (L4)
                    </span>
                    <span className={`text-xs font-mono text-cyan-400 ${currentPreview.cssClass}`} style={currentPreview.style}>
                      12 Hours • 4 Practical Modules
                    </span>
                  </div>
                </div>

                {/* SPREAD BUTTON ACTION BAR */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                      <Wand2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Spread {currentPreview.name} Everywhere</p>
                      <p className="text-xs text-slate-400 font-mono">
                        Propagates {currentPreview.name} across all workspace headings, body text, cards, and UI controls.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSpreadTypography}
                    size="lg"
                    className={`w-full sm:w-auto font-bold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-white cursor-pointer ${
                      spreadSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-500/30 hover:scale-[1.02]'
                    }`}
                  >
                    {spreadSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Spread Applied to Entire Platform!
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Spread Typography Across Platform
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
