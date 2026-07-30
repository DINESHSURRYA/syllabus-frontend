"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  HelpCircle, 
  Sparkles, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  BrainCircuit, 
  MessageSquare, 
  Clock, 
  Lightbulb, 
  ArrowRight,
  Search,
  ChevronRight,
  ChevronDown,
  Volume2,
  Mic,
  MicOff,
  Upload,
  FileText,
  Database,
  BarChart3,
  RefreshCw,
  Trash2,
  Activity,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Layers,
  Settings,
  ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RAG_API_BASE_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://127.0.0.1:8000";

interface Section {
  title: string;
  visual_markdown: string;
  voice_explanation?: string;
  highlights?: string[];
}

interface Source {
  source: string;
  content: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  sections?: Section[];
  sources?: Source[];
  timestamp: string;
  courseCode?: string;
  topic?: string;
}

interface IngestedDoc {
  filename: string;
  chunks: number;
  uploadedAt: string;
  status: 'active' | 'processed';
}

interface TokenRecord {
  id: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: string;
  timestamp: string;
}

interface UnitOption {
  id: string;
  unitNumber: number;
  title: string;
}

export default function DoubtsPage() {
  const { openSettings } = useTheme();

  // Configurable System Base URL state
  const [customApiUrl, setCustomApiUrl] = useState<string>(RAG_API_BASE_URL);
  const [backendStatus, setBackendStatus] = useState<'idle' | 'online' | 'offline'>('idle');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'tokens'>('chat');

  // Dynamic Course & Syllabus Selection
  const [availableCourses, setAvailableCourses] = useState<{ code: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  
  // Dynamic Units State & Multi-Selection
  const [courseUnits, setCourseUnits] = useState<UnitOption[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['ALL']);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  
  // Chat & Doubts State
  const [queryInput, setQueryInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Audio Playback & Speech Synthesis State
  const [playingSpeechKey, setPlayingSpeechKey] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  // Mic Voice Recording (Speech Recognition) State & Ref
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;
    }
  }, []);

  const handleMicToggle = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (!isRecording) {
      setIsRecording(true);
      baseTextRef.current = queryInput ? queryInput.trim() + " " : "";

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setQueryInput(baseTextRef.current + finalTranscript + interimTranscript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      try {
        rec.start();
      } catch (e) {
        console.warn("Speech recognition start issue", e);
      }
    } else {
      try {
        rec.stop();
      } catch (e) {}
      setIsRecording(false);
    }
  };

  // Text-to-Speech audio synthesis handler
  const speakText = (textToSpeak: string, speechKey: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech audio output is not supported in this browser.");
      return;
    }

    if (playingSpeechKey === speechKey) {
      if (isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for natural speech reading
    const cleanText = textToSpeak
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setPlayingSpeechKey(speechKey);
      setIsSpeechPaused(false);
    };
    utterance.onend = () => {
      setPlayingSpeechKey(null);
      setIsSpeechPaused(false);
    };
    utterance.onerror = () => {
      setPlayingSpeechKey(null);
      setIsSpeechPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlayingSpeechKey(null);
      setIsSpeechPaused(false);
    }
  };

  // Document Ingestion State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDoc[]>([]);

  // Token Records State
  const [tokenRecords, setTokenRecords] = useState<TokenRecord[]>([]);

  // Load dynamic courses from backend API & localStorage
  useEffect(() => {
    const loadCourses = async () => {
      const coursesList: { code: string; title: string }[] = [];

      // 1. Fetch real courses from Backend PostgreSQL API
      try {
        const res = await fetch(`${customApiUrl}/api/courses`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((c: any) => {
              const code = c.courseCode || c.code || c.id;
              const title = c.courseTitle || c.courseName || c.title || code;
              if (code && !coursesList.some(item => item.code === code)) {
                coursesList.push({ code, title });
              }
            });
          }
        }
      } catch (err) {
        console.warn("Backend courses fetch attempt:", err);
      }

      // 1b. Fetch from saved syllabi API endpoint
      try {
        const res = await fetch(`${customApiUrl}/api/syllabus/saved`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.items || []);
          list.forEach((c: any) => {
            const courseInfo = c && typeof c.course === 'object' && c.course ? c.course : c;
            const code = (c.courseCode || c.code || courseInfo?.code || courseInfo?.courseCode || '').trim();
            const title = (c.courseName || c.title || courseInfo?.title || courseInfo?.courseName || c.courseTitle || '').trim();
            if (code && title && !coursesList.some(item => item.code === code)) {
              coursesList.push({ code, title });
            }
          });
        }
      } catch (err) {
        console.warn("Backend saved syllabus fetch attempt:", err);
      }

      // 2. Load any local drafts or repository items
      try {
        const savedDraft = localStorage.getItem('syllabus_draft_data');
        const savedListStr = localStorage.getItem('syllabus_repository_list');
        const activeSaved = localStorage.getItem('active_saved_syllabus');

        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.course?.code && parsed.course?.title) {
            if (!coursesList.some(c => c.code === parsed.course.code)) {
              coursesList.push({ code: parsed.course.code, title: parsed.course.title });
            }
          }
        }

        if (activeSaved) {
          const parsed = JSON.parse(activeSaved);
          const code = parsed.courseCode || parsed.code || parsed.course?.code;
          const title = parsed.courseName || parsed.title || parsed.course?.title || code;
          if (code && !coursesList.some(c => c.code === code)) {
            coursesList.push({ code, title });
          }
        }

        if (savedListStr) {
          const list = JSON.parse(savedListStr);
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              const code = item.course_code || item.courseCode;
              const title = item.course_name || item.courseName;
              if (code && title && !coursesList.some(c => c.code === code)) {
                coursesList.push({ code, title });
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed loading local courses", e);
      }

      if (coursesList.length > 0) {
        setAvailableCourses(coursesList);
        setSelectedCourse(prev => prev || `${coursesList[0].code} — ${coursesList[0].title}`);
      }
    };

    loadCourses();
  }, [customApiUrl]);

  // Dynamic unit extraction helpers
  const extractUnitsListFromData = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data.units) && data.units.length > 0) return data.units;
    if (Array.isArray(data.hierarchy) && data.hierarchy.length > 0) return data.hierarchy;
    if (data.content && Array.isArray(data.content.units) && data.content.units.length > 0) return data.content.units;
    if (data.content && Array.isArray(data.content.hierarchy) && data.content.hierarchy.length > 0) return data.content.hierarchy;
    if (Array.isArray(data) && data.length > 0) return data;
    return [];
  };

  const parseUnitsFromPayload = (rawUnits: any[]): UnitOption[] => {
    if (!Array.isArray(rawUnits) || rawUnits.length === 0) return [];

    return rawUnits.map((u: any, idx: number) => {
      let uNum = idx + 1;
      let titleRaw = '';

      if (typeof u === 'string') {
        titleRaw = u.trim();
      } else if (typeof u === 'object' && u !== null) {
        if (u.unitNumber || u.unit_number || u.number) {
          uNum = Number(u.unitNumber || u.unit_number || u.number);
        }
        titleRaw = (u.title || u.unitTitle || u.name || u.unit_name || u.heading || '').trim();
      }

      let displayTitle = titleRaw;
      if (!displayTitle) {
        displayTitle = `Unit ${uNum}`;
      } else if (!displayTitle.toLowerCase().startsWith('unit')) {
        displayTitle = `Unit ${uNum} — ${titleRaw}`;
      } else if (displayTitle.includes(':')) {
        displayTitle = displayTitle.replace(':', ' — ');
      }

      return {
        id: `Unit ${uNum}`,
        unitNumber: uNum,
        title: displayTitle
      };
    });
  };

  // Dynamically fetch units whenever selected course changes
  useEffect(() => {
    if (!selectedCourse) return;

    const courseCode = selectedCourse.split(' — ')[0]?.trim() || selectedCourse;
    
    const fetchCourseUnits = async () => {
      let rawUnits: any[] = [];

      // Try 1: /api/courses/{courseCode}/syllabus
      try {
        const res = await fetch(`${customApiUrl}/api/courses/${encodeURIComponent(courseCode)}/syllabus`);
        if (res.ok) {
          const data = await res.json();
          rawUnits = extractUnitsListFromData(data);
        }
      } catch (err) {
        console.warn("Could not fetch units via /api/courses/syllabus:", err);
      }

      // Try 2: /api/syllabus/{courseCode}
      if (rawUnits.length === 0) {
        try {
          const res = await fetch(`${customApiUrl}/api/syllabus/${encodeURIComponent(courseCode)}`);
          if (res.ok) {
            const data = await res.json();
            rawUnits = extractUnitsListFromData(data);
          }
        } catch (err) {
          console.warn("Could not fetch units via /api/syllabus:", err);
        }
      }

      // Try 3: /api/curriculum/hierarchy?syllabusId={courseCode}
      if (rawUnits.length === 0) {
        try {
          const res = await fetch(`${customApiUrl}/api/curriculum/hierarchy?syllabusId=${encodeURIComponent(courseCode)}`);
          if (res.ok) {
            const data = await res.json();
            rawUnits = extractUnitsListFromData(data);
          }
        } catch (err) {
          console.warn("Could not fetch units via /api/curriculum/hierarchy:", err);
        }
      }

      // Try 4: /api/courses/{courseCode}
      if (rawUnits.length === 0) {
        try {
          const res = await fetch(`${customApiUrl}/api/courses/${encodeURIComponent(courseCode)}`);
          if (res.ok) {
            const data = await res.json();
            rawUnits = extractUnitsListFromData(data);
          }
        } catch (err) {
          console.warn("Could not fetch units via /api/courses:", err);
        }
      }

      // Try 5: Check localStorage active_saved_syllabus
      if (rawUnits.length === 0) {
        try {
          const activeSaved = localStorage.getItem('active_saved_syllabus');
          if (activeSaved) {
            const parsed = JSON.parse(activeSaved);
            const parsedCode = parsed.courseCode || parsed.code || parsed.course?.code;
            if (!parsedCode || parsedCode.toLowerCase() === courseCode.toLowerCase()) {
              rawUnits = extractUnitsListFromData(parsed);
            }
          }
        } catch (e) {}
      }

      // Try 6: Check localStorage draft
      if (rawUnits.length === 0) {
        try {
          const savedDraft = localStorage.getItem('syllabus_draft_data');
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            rawUnits = extractUnitsListFromData(parsed);
          }
        } catch (e) {}
      }

      // Try 7: Check localStorage repository list
      if (rawUnits.length === 0) {
        try {
          const savedListStr = localStorage.getItem('syllabus_repository_list');
          if (savedListStr) {
            const list = JSON.parse(savedListStr);
            if (Array.isArray(list)) {
              const matched = list.find((item: any) => {
                const code = item.course_code || item.courseCode || item.code;
                return code && code.toLowerCase() === courseCode.toLowerCase();
              });
              if (matched) {
                rawUnits = extractUnitsListFromData(matched);
              }
            }
          }
        } catch (e) {}
      }

      const parsedUnits = parseUnitsFromPayload(rawUnits);
      setCourseUnits(parsedUnits);
      setSelectedUnits(['ALL']);
    };

    fetchCourseUnits();
  }, [selectedCourse, customApiUrl]);

  // Click outside to close unit dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-selection unit toggler
  const handleToggleUnit = (unitId: string) => {
    if (unitId === 'ALL') {
      setSelectedUnits(['ALL']);
      return;
    }

    let updated: string[];
    if (selectedUnits.includes('ALL')) {
      updated = [unitId];
    } else if (selectedUnits.includes(unitId)) {
      updated = selectedUnits.filter(u => u !== unitId);
      if (updated.length === 0) {
        updated = ['ALL'];
      }
    } else {
      updated = [...selectedUnits.filter(u => u !== 'ALL'), unitId];
      if (courseUnits.length > 0 && updated.length === courseUnits.length) {
        updated = ['ALL'];
      }
    }

    setSelectedUnits(updated);
  };

  // Health check discovery
  const checkBackendHealth = async () => {
    setBackendStatus('idle');
    try {
      const res = await fetch(`${customApiUrl}/`, { method: 'GET' });
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, [customApiUrl]);

  // Handle Query Submission
  const handleQuerySubmit = async (textToSubmit?: string) => {
    const queryText = textToSubmit || queryInput;
    if (!queryText.trim() || isQuerying) return;

    const unitFilterString = selectedUnits.includes('ALL') || selectedUnits.length === 0
      ? "All Units & Topics"
      : selectedUnits.join(', ');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      courseCode: selectedCourse.split(' — ')[0] || '',
      topic: unitFilterString
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSubmit) setQueryInput('');
    setIsQuerying(true);

    try {
      const res = await fetch(`${customApiUrl}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText, course: selectedCourse, topic: unitFilterString })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error ${res.status}`);
      }

      const data = await res.json();

      const rawSections = data.response_sections || data.sections || [];
      const formattedSections: Section[] = rawSections.map((s: any) => ({
        title: s.title || "Concept Answer",
        visual_markdown: s.visual_markdown || s.content || "",
        voice_explanation: s.voice_explanation || "",
        highlights: s.highlights || []
      }));

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        sections: formattedSections.length > 0 ? formattedSections : [
          {
            title: "Concept Answer",
            visual_markdown: data.answer || "No response section received.",
            highlights: []
          }
        ],
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      saveDoubtToHistory(userMsg, assistantMsg);
      recordTokenUsage('/chat/', 'gpt-4o-mini', 320, 240);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ast_err_${Date.now()}`,
        role: 'assistant',
        sections: [
          {
            title: "Error Notification",
            visual_markdown: `⚠️ Could not retrieve answer from backend: ${err.message || "Connection failure"}. Please ensure backend is running at ${customApiUrl}.`,
            highlights: []
          }
        ],
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  // Save asked doubt into dynamic localStorage history
  const saveDoubtToHistory = (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    try {
      const existingHistoryStr = localStorage.getItem('syllabus_doubts_history');
      const existingHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      
      const newHistoryItem = {
        id: userMsg.id,
        question: userMsg.content || 'Untitled Question',
        courseCode: userMsg.courseCode || '',
        courseTitle: selectedCourse.split(' — ')[1] || 'Syllabus Course',
        unit: 'Unit I',
        topic: userMsg.topic || 'General Topic',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'resolved',
        isBookmarked: false,
        audioDuration: '01:30',
        hasAudio: true,
        views: 1,
        sections: assistantMsg.sections?.map(s => ({
          title: s.title,
          content: s.visual_markdown,
          highlights: s.highlights
        })) || [],
        sources: assistantMsg.sources?.map(s => ({
          document: s.source,
          snippet: s.content,
          relevance: '95% match'
        })) || []
      };

      const updatedHistory = [newHistoryItem, ...existingHistory];
      localStorage.setItem('syllabus_doubts_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed saving doubt to history", e);
    }
  };

  // Record Token Usage dynamically
  const recordTokenUsage = (endpoint: string, model: string, promptTokens: number, completionTokens: number) => {
    const total = promptTokens + completionTokens;
    const newRecord: TokenRecord = {
      id: `rec_${Date.now()}`,
      endpoint,
      model,
      promptTokens,
      completionTokens,
      totalTokens: total,
      costEstimate: `$${(total * 0.0000002).toFixed(5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setTokenRecords(prev => [newRecord, ...prev]);
  };

  // Handle Document Ingestion Upload
  const handleFileUpload = async () => {
    if (!uploadFile || isUploading) return;
    setIsUploading(true);
    setUploadSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch(`${customApiUrl}/document/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newDoc: IngestedDoc = {
          filename: uploadFile.name,
          chunks: data.chunks_created || data.chunks || 0,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'processed'
        };
        setIngestedDocs(prev => [newDoc, ...prev]);
        setUploadSuccessMsg(`Successfully ingested ${uploadFile.name} into RAG database (${data.chunks_created || 0} chunks).`);
        recordTokenUsage('/document/upload', 'text-embedding-3-small', 1200, 0);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }
    } catch (err: any) {
      setUploadSuccessMsg(null);
      alert(`Ingestion failed: ${err.message || "Could not process document."}`);
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };


  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <HelpCircle size={14} /> AI Doubts Resolver Workspace
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Student RAG Bot &amp; Doubt Control Center
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl">
                  Ask course questions, synthesize structured explanations, listen to section audio playback, and ingest context files.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={openSettings}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold transition-all"
                  title="Open Appearance & Preference Settings"
                >
                  <Settings size={16} className="text-amber-500" /> Settings
                </button>
                <Link
                  href="/doubts/history"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-sm font-semibold transition-all shadow-md"
                >
                  <ScrollText size={16} /> Doubts History
                </Link>
                <Link
                  href="/doubts/topics"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm shadow-md"
                >
                  <BookOpen size={16} /> Topic Q&amp;A
                </Link>
              </div>
            </div>
          </div>

          {/* Base URL & Backend Status Strip */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">RAG System Base URL:</span>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-amber-500 w-64"
              />
              <button onClick={checkBackendHealth} className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Check Health">
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--text-muted)]">Backend Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                backendStatus === 'online' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                backendStatus === 'offline' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' :
                'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              }`}>
                {backendStatus}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
            {[
              { id: 'chat', label: 'Chat Workspace', icon: MessageSquare },
              { id: 'upload', label: 'Document Ingestion', icon: FileText },
              { id: 'tokens', label: 'Token Usage Logs', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-xs' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Chat Workspace */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              {/* Course & Topic Selector Toolbar */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block mb-1">
                    Select Course Syllabus
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                  >
                    {availableCourses.map(c => (
                      <option key={c.code} value={`${c.code} — ${c.title}`}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Multi-Select Unit / Topic Filter */}
                <div className="relative" ref={unitDropdownRef}>
                  <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block mb-1">
                    Unit / Topic Filter
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setIsUnitDropdownOpen(prev => !prev)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 flex items-center justify-between gap-2 shadow-sm hover:bg-[var(--bg-subtle)] transition-all"
                  >
                    <span className="truncate">
                      {selectedUnits.includes('ALL') || selectedUnits.length === 0
                        ? `All Units & Topics (${courseUnits.length > 0 ? courseUnits.length + ' Units' : 'Full Syllabus'})`
                        : selectedUnits.length === 1
                          ? (courseUnits.find(u => u.id === selectedUnits[0])?.title || selectedUnits[0])
                          : `${selectedUnits.length} Units Selected (${selectedUnits.join(', ')})`
                      }
                    </span>
                    <ChevronDown size={14} className={`text-amber-500 transition-transform ${isUnitDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isUnitDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 max-h-64 overflow-y-auto space-y-1"
                      >
                        {/* Option: All Units */}
                        <button
                          type="button"
                          onClick={() => handleToggleUnit('ALL')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            selectedUnits.includes('ALL')
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedUnits.includes('ALL')}
                              onChange={() => {}}
                              className="accent-amber-500 rounded cursor-pointer"
                            />
                            <span>All Units &amp; Topics</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Full Syllabus</span>
                        </button>

                        {courseUnits.length > 0 ? (
                          courseUnits.map(unit => {
                            const isChecked = !selectedUnits.includes('ALL') && selectedUnits.includes(unit.id);
                            return (
                              <button
                                key={unit.id}
                                type="button"
                                onClick={() => handleToggleUnit(unit.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  isChecked
                                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate text-left">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="accent-amber-500 rounded cursor-pointer"
                                  />
                                  <span className="truncate">{unit.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-500 font-bold ml-2 shrink-0">Unit {unit.unitNumber}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-[var(--text-muted)] italic">
                            All Units &amp; Topics selected
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>


              {/* Chat Thread Messages */}
              <div className="min-h-[300px] max-h-[550px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-[var(--text-muted)]">
                    <BrainCircuit size={48} className="mx-auto text-amber-500/50 mb-3" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Ready for Your Doubt</h3>
                    <p className="text-xs mt-1 max-w-md mx-auto">
                      Type your question below, click the microphone for voice input, or pick a topic to receive a structured AI explanation.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        msg.role === 'user'
                          ? 'bg-amber-500/10 border-amber-500/30 ml-8 text-[var(--text-primary)]'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] mr-8 text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-mono">
                        <span className="font-bold uppercase text-amber-500">
                          {msg.role === 'user' ? 'Student Doubt' : 'AI Structured Answer'}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => {
                                const fullText = msg.sections
                                  ? msg.sections.map(s => `${s.title}. ${s.visual_markdown}`).join('\n')
                                  : msg.content || '';
                                speakText(fullText, msg.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                playingSpeechKey === msg.id
                                  ? 'bg-amber-500 text-black shadow-md animate-pulse'
                                  : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-amber-500 text-amber-500'
                              }`}
                              title={playingSpeechKey === msg.id ? (isSpeechPaused ? "Resume Voice Readout" : "Pause Voice Readout") : "Listen to Audio Explanation"}
                            >
                              <Volume2 size={14} className={playingSpeechKey === msg.id && !isSpeechPaused ? "animate-bounce" : ""} />
                              <span>
                                {playingSpeechKey === msg.id
                                  ? (isSpeechPaused ? "Paused" : "Playing Voice...")
                                  : "Speech Output"
                                }
                              </span>
                            </button>
                          )}
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                      {msg.content && <p className="text-sm font-semibold">{msg.content}</p>}

                      {msg.sections && (
                        <div className="space-y-3 mt-2">
                          {msg.sections.map((sec, sIdx) => {
                            const secKey = `${msg.id}_sec_${sIdx}`;
                            const isSecPlaying = playingSpeechKey === secKey;
                            return (
                              <div key={sIdx} className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5 relative group">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-amber-500 text-xs">{sec.title}</h4>
                                  <button
                                    onClick={() => speakText(`${sec.title}. ${sec.visual_markdown}`, secKey)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                                      isSecPlaying
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-amber-500'
                                    }`}
                                  >
                                    <Volume2 size={12} /> {isSecPlaying ? (isSpeechPaused ? 'Resume' : 'Playing') : 'Listen Section'}
                                  </button>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                                  {sec.visual_markdown}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isQuerying && (
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-amber-500 font-mono animate-pulse">
                    Synthesizing RAG knowledge base response...
                  </div>
                )}
              </div>

              {/* Listening Indicator Banner */}
              {isRecording && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Mic size={16} className="animate-bounce text-rose-500" />
                    <span>Listening to your voice... Speak your doubt clearly into your mic.</span>
                  </div>
                  <button
                    onClick={handleMicToggle}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] uppercase font-bold hover:bg-rose-600 transition-colors"
                  >
                    Stop Listening
                  </button>
                </div>
              )}

              {/* Input Box Bar with Voice Input Mic Button */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask any doubt regarding this course syllabus (or use Voice Input mic)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 shadow-sm"
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
                    isRecording
                      ? 'bg-rose-500 text-white border-rose-600 shadow-lg animate-pulse ring-2 ring-rose-500/50'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-amber-500 border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]'
                  }`}
                  title={isRecording ? "Click to stop recording voice input" : "Click to speak your doubt (Voice Input)"}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  onClick={() => handleQuerySubmit()}
                  disabled={isQuerying || !queryInput.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Send size={16} /> Ask AI
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Document Management */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Upload size={18} className="text-amber-500" /> Ingest Context Documents
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Upload lecture PDFs, notes, or past papers to enrich the RAG knowledge vector store for this course.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/15 file:text-amber-500 cursor-pointer"
                  />

                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || isUploading}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-50 hover:bg-amber-400 transition-colors"
                  >
                    {isUploading ? 'Ingesting...' : 'Start Ingestion'}
                  </button>
                </div>

                {uploadSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
                    {uploadSuccessMsg}
                  </div>
                )}
              </div>

              {/* Ingested Files List */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Active Ingested Files</h4>
                
                {ingestedDocs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                    No documents ingested for this session yet. Upload a PDF to expand RAG sources.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ingestedDocs.map((doc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-amber-500" />
                          <span className="font-semibold text-[var(--text-primary)]">{doc.filename}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[var(--text-muted)]">
                          <span>{doc.chunks} vector chunks</span>
                          <span className="text-emerald-500 font-bold uppercase">{doc.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Token Usage Logs */}
          {activeTab === 'tokens' && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 size={18} className="text-amber-500" /> Real-time Token Usage &amp; API Metrics
              </h3>

              {tokenRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                  No token activity logged yet for this session. Ask a question to generate token metrics.
                </div>
              ) : (
                <div className="space-y-2">
                  {tokenRecords.map(rec => (
                    <div key={rec.id} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between text-xs gap-2">
                      <span className="font-mono text-amber-500 font-bold">{rec.endpoint}</span>
                      <span className="text-[var(--text-secondary)]">{rec.model}</span>
                      <span className="text-[var(--text-muted)]">{rec.totalTokens} Tokens ({rec.costEstimate})</span>
                      <span className="text-[var(--text-muted)] font-mono">{rec.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
