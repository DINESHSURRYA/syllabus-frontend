"use client";
import './styles/page.css';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Globe,
  Users,
  Copy,
  Check,
  Key,
  MonitorPlay,
  Share2,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Plus,
  Play,
  Pause,
  AlertTriangle,
  UploadCloud,
  X
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useMCQStore } from '@/stores';
import { Assessment } from '@/types';
import { toast } from 'sonner';

export default function AssessmentManagementPage() {
  const router = useRouter();
  const { assessments, updateAssessment, deleteAssessment } = useMCQStore();

  // Selected assessment being configured for security
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(assessments[0]?.id || '');
  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId) || assessments[0];

  // Security config local state
  const [isPublic, setIsPublic] = useState(activeAssessment?.accessControl?.isPublic ?? false);
  const [hasAccessCode, setHasAccessCode] = useState(activeAssessment?.accessControl?.hasAccessCode ?? true);
  const [accessCode, setAccessCode] = useState(activeAssessment?.accessControl?.accessCode || 'DSA2026');
  const [domainRestrictions, setDomainRestrictions] = useState<string[]>(
    activeAssessment?.accessControl?.domainRestrictions || ['@university.edu', '@institution.ac.in']
  );
  const [newDomain, setNewDomain] = useState('');
  const [whitelistInput, setWhitelistInput] = useState(
    activeAssessment?.accessControl?.whitelistedEmails?.join('\n') || 'student1@university.edu\ncandidate@institution.ac.in'
  );

  // Proctoring local state
  const [trackTabSwitches, setTrackTabSwitches] = useState(
    activeAssessment?.proctoring?.trackTabSwitches ?? true
  );
  const [enforceFullscreen, setEnforceFullscreen] = useState(
    activeAssessment?.proctoring?.enforceFullscreen ?? true
  );
  const [maxTabSwitches, setMaxTabSwitches] = useState(
    activeAssessment?.proctoring?.maxTabSwitches ?? 3
  );

  const handleSelectAssessment = (asm: Assessment) => {
    setSelectedAssessmentId(asm.id);
    setIsPublic(asm.accessControl.isPublic);
    setHasAccessCode(asm.accessControl.hasAccessCode);
    setAccessCode(asm.accessControl.accessCode);
    setDomainRestrictions(asm.accessControl.domainRestrictions || []);
    setWhitelistInput(asm.accessControl.whitelistedEmails?.join('\n') || '');
    setTrackTabSwitches(asm.proctoring.trackTabSwitches);
    setEnforceFullscreen(asm.proctoring.enforceFullscreen);
    setMaxTabSwitches(asm.proctoring.maxTabSwitches);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const formatted = newDomain.startsWith('@') ? newDomain.trim() : `@${newDomain.trim()}`;
    if (domainRestrictions.includes(formatted)) return;
    setDomainRestrictions([...domainRestrictions, formatted]);
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    setDomainRestrictions(domainRestrictions.filter((d) => d !== dom));
  };

  const handleSaveSecuritySettings = () => {
    if (!activeAssessment) return;
    const whitelistedEmails = whitelistInput
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    updateAssessment({
      ...activeAssessment,
      accessControl: {
        isPublic,
        hasAccessCode,
        accessCode,
        domainRestrictions,
        whitelistedEmails,
      },
      proctoring: {
        trackTabSwitches,
        enforceFullscreen,
        maxTabSwitches: Number(maxTabSwitches),
      },
    });

    toast.success(`Security rules updated for "${activeAssessment.title}"`);
  };

  const copyShareLink = (asmId: string) => {
    const url = `${window.location.origin}/exam/portal?id=${asmId}`;
    navigator.clipboard.writeText(url);
    toast.success('Candidate Exam Portal link copied to clipboard!');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Access code "${code}" copied to clipboard!`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/70 p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> SECURITY & PROCTORING MANAGEMENT
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Assessment Management & Security
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Configure access controls, password rules, domain whitelists, and live tab-switch proctoring metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded-2xl shadow-md"
            >
              <Link href="/assessments/builder">
                <Plus size={16} className="mr-1.5" /> Build New Exam
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Security Configurator Panel */}
        {activeAssessment && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Access Rules */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock size={18} className="text-cyan-500" /> Access Control Configurator
                  </h2>
                  <span className="text-xs font-mono text-cyan-500 font-bold">
                    Editing: {activeAssessment.title.slice(0, 24)}...
                  </span>
                </div>

                {/* Public Access Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Globe size={14} className="text-sky-500" /> Public Access Toggle
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Allow anyone with the link to take this exam without password.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="accent-cyan-500 w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Access Code Settings */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Key size={14} className="text-amber-500" /> Access Code Protection
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Require candidate to enter passkey before entering exam.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasAccessCode}
                      onChange={(e) => setHasAccessCode(e.target.checked)}
                      className="accent-cyan-500 w-5 h-5 cursor-pointer"
                    />
                  </div>

                  {hasAccessCode && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-black px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAccessCode(`PASS-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-xs font-mono shrink-0"
                      >
                        Generate Code
                      </Button>
                    </div>
                  )}
                </div>

                {/* Domain Restriction Multi-tag Input */}
                <div className="space-y-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-500" /> Restricted Email Domains
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. @university.edu"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-black px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <Button size="sm" onClick={handleAddDomain} className="bg-cyan-500 text-black font-mono font-bold text-xs shrink-0">
                      Add Tag
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {domainRestrictions.map((dom) => (
                      <span
                        key={dom}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                      >
                        {dom}
                        <button onClick={() => handleRemoveDomain(dom)} className="hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate Whitelist Text Area */}
                <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-500" /> Candidate Whitelist Emails
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">One per line</span>
                  </div>
                  <textarea
                    rows={3}
                    value={whitelistInput}
                    onChange={(e) => setWhitelistInput(e.target.value)}
                    placeholder="student1@university.edu&#10;candidate2@institution.ac.in"
                    className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-black p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Proctoring Rules & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" /> Proctoring & Integrity Configurator
                  </h2>
                </div>

                {/* Tab Switch Tracker */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Track Tab Switches (`tab_switch_count`)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Detect when candidate switches browser tabs or minimizes window.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={trackTabSwitches}
                    onChange={(e) => setTrackTabSwitches(e.target.checked)}
                    className="accent-cyan-500 w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Fullscreen Enforcement */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Enforce Fullscreen Mode
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Require candidate to lock browser into fullscreen during test.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceFullscreen}
                    onChange={(e) => setEnforceFullscreen(e.target.checked)}
                    className="accent-cyan-500 w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Max Tab Switch Allowance */}
                <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Max Tab Switch Allowance Before Auto-Submission
                    </p>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono font-bold text-xs">
                      {maxTabSwitches} Switches Max
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={maxTabSwitches}
                    onChange={(e) => setMaxTabSwitches(parseInt(e.target.value) || 3)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <Button
                  onClick={handleSaveSecuritySettings}
                  size="lg"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl shadow-md"
                >
                  Save Security Rules & Apply Config
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Table & Management List */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MonitorPlay size={18} className="text-cyan-500" /> Active & Archived Assessment Registry
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Title & Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Access Code</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Attempts</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {assessments.map((asm) => {
                  const isCurrent = activeAssessment?.id === asm.id;
                  return (
                    <tr
                      key={asm.id}
                      onClick={() => handleSelectAssessment(asm)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-cyan-500/10 dark:bg-cyan-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        <div>
                          <p className="text-xs">{asm.title}</p>
                          <span className="text-[10px] font-mono text-cyan-500 uppercase">{asm.type} test</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                            asm.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {asm.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-500">
                        {asm.accessControl.hasAccessCode ? asm.accessControl.accessCode : 'None (Public)'}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {asm.durationMinutes} mins
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {asm.attemptsCount || 0} candidates
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyShareLink(asm.id)}
                            title="Copy Candidate Portal Link"
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            onClick={() => copyCode(asm.accessControl.accessCode || 'None')}
                            title="Copy Access Code"
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => router.push('/assessments/analytics')}
                            title="View Analytics"
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteAssessment(asm.id)}
                            title="Delete Assessment"
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
