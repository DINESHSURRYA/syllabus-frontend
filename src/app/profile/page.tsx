"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Award, 
  FileText, 
  Save, 
  RotateCcw, 
  Edit3, 
  CheckCircle2, 
  Camera, 
  Download, 
  KeyRound, 
  BellRing, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  X, 
  Copy,
  Check
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExportJsonOpen, setIsExportJsonOpen] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    fullName: 'Dr. Curriculum Admin',
    title: 'Senior Curriculum Director / Professor',
    department: 'Computer Science & Engineering',
    institution: 'Anna University',
    email: 'admin.curriculum@annauniv.edu',
    phone: '+91 98765 43210',
    officeLocation: 'Room 304, CS Block, Main Campus',
    bio: 'Senior Academic Director specializing in Automated Curriculum Design, Compiler Optimization, and Outcome-Based Education (OBE) frameworks. Leading AI syllabus integration and bloom taxonomy verification.',
    avatarUrl: '',
    preferences: {
      emailNotifications: true,
      autoSaveEdits: true,
      aiVerificationAlerts: true,
    }
  });

  // Draft State for Cancel/Reset
  const [draftProfile, setDraftProfile] = useState(profile);

  // Password Modal State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
    toast.info("Profile changes discarded.");
  };

  const handleSaveChanges = () => {
    setProfile(draftProfile);
    setIsEditing(false);
    toast.success("Curriculum Admin Profile updated successfully!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDraftProfile((prev) => ({ ...prev, avatarUrl: url }));
      setProfile((prev) => ({ ...prev, avatarUrl: url }));
      toast.success("Profile photo updated!");
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    toast.success("Security credentials updated successfully!");
    setIsChangePasswordOpen(false);
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
    setCopiedJson(true);
    toast.success("Profile JSON copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* ==================================================================== */}
        {/* HEADER TOP BAR & EDIT CONTROLS */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono font-bold text-cyan-300">
                <User size={14} /> CURRICULUM ADMIN PROFILE
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">● STUDIO MANAGEMENT</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              Admin Profile & Preferences
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button
                onClick={handleStartEdit}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md flex items-center gap-2"
              >
                <Edit3 size={16} /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <RotateCcw size={16} className="mr-1.5" /> Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg flex items-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ADMIN HEADER CARD */}
        {/* ==================================================================== */}
        <div className="semantic-card relative overflow-hidden rounded-[32px] p-6 sm:p-8 backdrop-blur-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar Preview with Photo Upload */}
            <div className="relative group shrink-0">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-blue-600 p-1 shadow-xl">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-full w-full rounded-[22px] object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-[22px] bg-slate-900 flex items-center justify-center text-3xl font-black text-white">
                    AI
                  </div>
                )}
              </div>

              {/* Upload Photo Button Overlay */}
              <label
                htmlFor="photo-upload"
                className="absolute bottom-1 right-1 h-9 w-9 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg hover:bg-cyan-400 cursor-pointer transition-transform hover:scale-110"
                title="Upload New Photo"
              >
                <Camera size={18} />
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Core Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {profile.fullName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono font-bold text-emerald-400 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  STUDIO ACTIVE
                </span>
              </div>

              <p className="text-sm font-semibold text-[var(--text-accent)] flex items-center gap-2">
                <Award size={16} /> {profile.title}
              </p>

              <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Building2 size={14} /> {profile.department}, {profile.institution}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  onClick={() => setIsExportJsonOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <Download size={14} className="mr-1.5 text-cyan-400" /> Export Profile Data (JSON)
                </Button>

                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <KeyRound size={14} className="mr-1.5 text-indigo-400" /> Change Security Password
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* EDITABLE ADMIN DETAILS FORM & BIO */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Admin Contact & Academic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="semantic-card rounded-[28px] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[var(--border-subtle)]">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Academic & Contact Information</h3>
                  <p className="text-xs text-[var(--text-muted)]">Official director metadata and department details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.fullName}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.fullName}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Academic Title / Designation *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.title}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.title}
                    </div>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.department}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.department}
                    </div>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Institution</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.institution}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, institution: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.institution}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <Mail size={12} /> Email Address *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={draftProfile.email}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.email}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <Phone size={12} /> Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.phone}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.phone}
                    </div>
                  )}
                </div>

                {/* Office Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <MapPin size={12} /> Office Location / Room No.
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftProfile.officeLocation}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, officeLocation: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                      {profile.officeLocation}
                    </div>
                  )}
                </div>

                {/* Bio / Overview */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <FileText size={12} /> Academic Bio / Overview
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={draftProfile.bio}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, bio: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                      {profile.bio}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preferences & System Permissions */}
          <div className="space-y-6">
            <div className="semantic-card rounded-[28px] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[var(--border-subtle)]">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Preferences & Permissions</h3>
                  <p className="text-xs text-[var(--text-muted)]">Automation and notification controls.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BellRing size={14} className="text-cyan-400" /> Email Notifications
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Receive alerts for syllabus status updates.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isEditing) return;
                      setDraftProfile((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, emailNotifications: !prev.preferences.emailNotifications }
                      }));
                    }}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      (isEditing ? draftProfile.preferences.emailNotifications : profile.preferences.emailNotifications)
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        (isEditing ? draftProfile.preferences.emailNotifications : profile.preferences.emailNotifications)
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Save Syllabus Edits */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Save size={14} className="text-emerald-400" /> Auto-Save Syllabus Edits
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Persist verification draft state automatically.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isEditing) return;
                      setDraftProfile((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, autoSaveEdits: !prev.preferences.autoSaveEdits }
                      }));
                    }}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      (isEditing ? draftProfile.preferences.autoSaveEdits : profile.preferences.autoSaveEdits)
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        (isEditing ? draftProfile.preferences.autoSaveEdits : profile.preferences.autoSaveEdits)
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* AI Verification Alerts */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" /> AI Verification Alerts
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Flag Bloom taxonomy mismatch warnings.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isEditing) return;
                      setDraftProfile((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, aiVerificationAlerts: !prev.preferences.aiVerificationAlerts }
                      }));
                    }}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      (isEditing ? draftProfile.preferences.aiVerificationAlerts : profile.preferences.aiVerificationAlerts)
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        (isEditing ? draftProfile.preferences.aiVerificationAlerts : profile.preferences.aiVerificationAlerts)
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CHANGE PASSWORD MODAL */}
        {/* ==================================================================== */}
        <AnimatePresence>
          {isChangePasswordOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="rounded-3xl border border-indigo-500/30 bg-slate-950 p-6 max-w-md w-full text-white shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-indigo-400" />
                    <h3 className="text-base font-bold">Change Security Password</h3>
                  </div>
                  <button
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordState.currentPassword}
                      onChange={(e) => setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordState.confirmPassword}
                      onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsChangePasswordOpen(false)}
                      className="text-xs font-mono text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* EXPORT JSON MODAL */}
        {/* ==================================================================== */}
        <AnimatePresence>
          {isExportJsonOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="rounded-3xl border border-cyan-500/30 bg-slate-950 p-6 max-w-xl w-full text-white shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Download size={18} className="text-cyan-400" />
                    <h3 className="text-base font-bold font-mono">Curriculum Admin Profile Payload</h3>
                  </div>
                  <button
                    onClick={() => setIsExportJsonOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl border border-slate-900 bg-slate-900/90 p-4 font-mono text-xs text-cyan-300">
                  <pre>{JSON.stringify(profile, null, 2)}</pre>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={handleCopyJson}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedJson ? <Check size={14} /> : <Copy size={14} />} {copiedJson ? "Copied!" : "Copy Profile JSON"}
                  </Button>
                  <Button
                    onClick={() => setIsExportJsonOpen(false)}
                    variant="ghost"
                    className="text-xs font-mono text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}
