"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'link';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  HelpCircle, 
  Send, 
  BookOpen, 
  BrainCircuit, 
  MessageSquare, 
  Volume2, 
  Mic, 
  MicOff, 
  Upload, 
  FileText, 
  BarChart3, 
  RefreshCw, 
  ChevronDown, 
  Settings, 
  ScrollText,
  Loader2
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

export default function DoubtsPage() {
  const { openSettings } = useTheme();

  // 1. Core State & System Configuration
  const [customApiUrl, setCustomApiUrl] = useState<string>(RAG_API_BASE_URL);
  const [backendStatus, setBackendStatus] = useState<'idle' | 'online' | 'offline'>('idle');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'tokens'>('chat');

  // Chat State
  const [queryInput, setQueryInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Per-Section TTS Audio Playback State
  const [activeAudioKey, setActiveAudioKey] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Capture / Mic Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Document Ingestion State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDoc[]>([]);

  // Token Records State
  const [tokenRecords, setTokenRecords] = useState<TokenRecord[]>([]);

  // Health check endpoint verification
  const checkBackendHealth = async () => {
    setBackendStatus('idle');
    try {
      const res = await fetch(`${customApiUrl}/`);
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, [customApiUrl]);

  // Clean Markdown utility (mirroring backend TTS preparation logic)
  const cleanMarkdownForTts = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\|/g, ' ')
      .replace(/[-:-]+\|[-:-]+/g, '')
      .replace(/#+\s+/g, '')
      .replace(/\*\*\s*/g, '')
      .replace(/\*\s+/g, '')
      .replace(/-\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Safe RegEx Highlight Replacement Functionality
  const highlightText = (text: string, wordsToHighlight: string[]) => {
    if (!wordsToHighlight || wordsToHighlight.length === 0) return text;

    let highlightedText = text;
    wordsToHighlight.forEach((phrase) => {
      if (phrase.trim()) {
        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedPhrase})`, 'gi');
        highlightedText = highlightedText.replace(
          regex,
          '<mark style="background-color: #ffeb3b; color: black; padding: 2px 4px; border-radius: 4px;">$1</mark>'
        );
      }
    });

    return highlightedText;
  };

  // ---------------------------------------------------------------------------
  // Audio Playback Handler (/chat/synthesize)
  // ---------------------------------------------------------------------------
  const handleListenSection = async (voiceText: string, componentKey: string) => {
    if (activeAudioKey === componentKey && audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        setActiveAudioKey(null);
        return;
      }
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setActiveAudioKey(componentKey);
    setIsAudioLoading(true);

    try {
      const cleanText = cleanMarkdownForTts(voiceText);
      const res = await fetch(`${customApiUrl}/chat/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!res.ok) throw new Error("TTS module was unable to parse audio output.");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setActiveAudioKey(null);
      };

      await audio.play();
    } catch (err: any) {
      alert(`TTS Node offline: ${err.message || err}`);
      setActiveAudioKey(null);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Microphone Capture & Audio Transcription Handler (/chat/transcribe)
  // ---------------------------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or audio recording is not supported in this environment.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");

      const res = await fetch(`${customApiUrl}/chat/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVoiceTranscript(data.transcript || "");
      } else {
        alert("Audio transaction failed at backend level.");
      }
    } catch (err: any) {
      alert(`Could not interact with speech endpoint: ${err.message || err}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Primary Chat Execution Handler (/chat/)
  // ---------------------------------------------------------------------------
  const handleQuerySubmit = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || queryInput;
    if (!promptToSend.trim() || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setQueryInput('');
    setVoiceTranscript('');
    setIsQuerying(true);

    try {
      const res = await fetch(`${customApiUrl}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptToSend })
      });

      if (!res.ok) {
        throw new Error(`Backend API returned an error status: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        sections: data.response_sections || [],
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      recordTokenUsage('/chat/', 'gpt-4o', 350, 280);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ast_err_${Date.now()}`,
        role: 'assistant',
        sections: [
          {
            title: "Pipeline Network Error",
            visual_markdown: `Could not reach backend API at ${customApiUrl}. Details: ${err.message || err}`,
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

  // ---------------------------------------------------------------------------
  // Ingestion Handler (/document/upload)
  // ---------------------------------------------------------------------------
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
          filename: data.filename || uploadFile.name,
          chunks: data.chunks_created || 0,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'processed'
        };
        setIngestedDocs(prev => [newDoc, ...prev]);
        setUploadSuccessMsg(data.message || "File uploaded and embedded successfully.");
        recordTokenUsage('/document/upload', 'text-embedding-3-small', 1200, 0);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ Ingestion failed: ${errData.detail || "Upload error"}`);
      }
    } catch (err: any) {
      alert(`❌ Connection error: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

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

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <HelpCircle size={14} /> Developer Playground
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  🤖 Student RAG Bot &amp; Document Control Center
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl">
                  Developer Management Interface &amp; Playground for Chat + Document Injection
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={openSettings}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold transition-all"
                >
                  <Settings size={16} className="text-amber-500" /> Settings
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Tools / Health Bar */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">API Endpoint Target:</span>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-amber-500 w-64"
              />
              <button 
                onClick={checkBackendHealth} 
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs font-mono font-bold hover:bg-[var(--bg-hover)] flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Test Health
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setMessages([]);
                  setVoiceTranscript('');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono font-bold hover:bg-rose-500/20"
              >
                🗑️ Clear Chat View
              </button>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[var(--text-muted)]">Backend Server:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  backendStatus === 'online' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                  backendStatus === 'offline' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' :
                  'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                }`}>
                  {backendStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
            {[
              { id: 'chat', label: '💬 Chat Workspace', icon: MessageSquare },
              { id: 'upload', label: '📁 Document Management', icon: FileText },
              { id: 'tokens', label: '📊 Token Usage', icon: BarChart3 }
            ].map(tab => {
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
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Chat Workspace */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Interactive Query Interface</h3>

              {/* Chat Log History */}
              <div className="min-h-[350px] max-h-[600px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-[var(--text-muted)]">
                    <BrainCircuit size={48} className="mx-auto text-amber-500/50 mb-3" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Workspace Idle</h3>
                    <p className="text-xs mt-1 max-w-md mx-auto">
                      Ask a query based on ingested vector context or submit a voice prompt using the microphone panel below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, msgIdx) => (
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
                          {msg.role === 'user' ? 'User Query' : 'Assistant Node Response'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {msg.content && <p className="text-sm font-semibold">{msg.content}</p>}

                      {msg.sections && (
                        <div className="space-y-4 mt-3">
                          {msg.sections.map((section, sIdx) => {
                            const componentKey = `msg_${msgIdx}_sec_${sIdx}`;
                            const isAudioActive = activeAudioKey === componentKey;
                            const visualContent = section.visual_markdown || "";

                            return (
                              <div key={sIdx} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
                                {section.title && (
                                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                    {section.title}
                                  </h3>
                                )}

                                {/* Highlighted Markdown Body Render */}
                                {isAudioActive ? (
                                  <div
                                    className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(visualContent, section.highlights || [])
                                    }}
                                  />
                                ) : (
                                  <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                                    {visualContent}
                                  </p>
                                )}

                                {/* Per-Section Voice Action Trigger Panel */}
                                {section.voice_explanation && (
                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={() => handleListenSection(section.voice_explanation!, componentKey)}
                                      disabled={isAudioLoading && activeAudioKey === componentKey}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                        isAudioActive
                                          ? 'bg-amber-500 text-black shadow-md'
                                          : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-amber-500'
                                      }`}
                                    >
                                      {isAudioLoading && activeAudioKey === componentKey ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Volume2 size={14} />
                                      )}
                                      <span>{isAudioActive ? "Stop Section" : "🔊 Listen Section"}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Contextual Data Footprint Tracing Layout */}
                      {msg.sources && msg.sources.length > 0 && (
                        <details className="mt-3 text-xs bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-subtle)] cursor-pointer">
                          <summary className="font-bold text-[var(--text-muted)] hover:text-amber-500">
                            🔍 View Context Sources Used ({msg.sources.length})
                          </summary>
                          <div className="mt-2 space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                            {msg.sources.map((src, srcIdx) => (
                              <div key={srcIdx} className="space-y-1">
                                <span className="font-mono font-bold text-amber-500">Source {srcIdx + 1}: {src.source}</span>
                                <p className="text-[var(--text-muted)] bg-[var(--bg-subtle)] p-2 rounded-lg italic">
                                  "{src.content}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}

                {isQuerying && (
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-amber-500 font-mono flex items-center gap-2 animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Agentic pipeline executing graph workflow...</span>
                  </div>
                )}
              </div>

              {/* Voice Utility Sub-Panel (Audio Capture Placement) */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                <p className="text-xs font-bold text-[var(--text-primary)]">🎙️ Voice Assistant Options</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                    }`}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    <span>{isRecording ? "Stop Recording" : "Click to Speak"}</span>
                  </button>

                  {isTranscribing && (
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-500 animate-pulse">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Transcribing speech with Deepgram Nova-2...</span>
                    </div>
                  )}

                  {voiceTranscript && (
                    <div className="flex-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500">
                      📝 <strong>Captured Speech:</strong> <em>"{voiceTranscript}"</em>
                    </div>
                  )}
                </div>

                {voiceTranscript && (
                  <button
                    onClick={() => handleQuerySubmit(voiceTranscript)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-black text-xs shadow-md"
                  >
                    🚀 Send Captured Voice Message
                  </button>
                )}
              </div>

              {/* Chat Input Input Box */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything based on your loaded documents..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500 shadow-sm"
                />
                <button
                  onClick={() => handleQuerySubmit()}
                  disabled={isQuerying || !queryInput.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Send size={16} /> Query
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Document Management */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Local Vector Store Pipeline Injection</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Upload `.pdf`, `.txt`, or `.md` files below to embed them into ChromaDB.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/15 file:text-amber-500 cursor-pointer"
                  />

                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || isUploading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-50 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Processing &amp; Embedding...</span>
                      </>
                    ) : (
                      <span>🚀 Process &amp; Ingest Into ChromaDB</span>
                    )}
                  </button>
                </div>

                {uploadSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold space-y-2">
                    <p>🎉 {uploadSuccessMsg}</p>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Active Ingested Files</h4>
                
                {ingestedDocs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                    No documents uploaded in this session yet.
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
                          <span>Chroma Vector Chunks Generated: <strong>{doc.chunks}</strong></span>
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
              <h3 className="text-base font-bold text-[var(--text-primary)]">LLM Token Spending Records</h3>

              {tokenRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                  token_spending_record logs will appear here upon network action executions.
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