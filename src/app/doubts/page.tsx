"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from '@/components/providers/theme-provider';
import { VoiceAssistantBar } from '@/components/voice/voice-assistant-bar';
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

const STOP_COMMANDS = [
  "stop",
  "stop it",
  "okay stop it",
  "ok stop it",
  "pause",
  "quiet",
  "shut up",
  "stop listening",
  "cancel",
  "exit voice",
  "turn off",
  "stop assistant"
];

const checkIsStopCommand = (text: string): boolean => {
  const normalized = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  return STOP_COMMANDS.some(cmd => normalized === cmd || normalized.endsWith(cmd) || normalized.includes(cmd));
};

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

  // Per-Section & Per-Message TTS Playback State
  const [activeAudioKey, setActiveAudioKey] = useState<string | null>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Document Ingestion State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDoc[]>([]);

  // Token Records State
  const [tokenRecords, setTokenRecords] = useState<TokenRecord[]>([]);

  // Continuous Voice AI Assistant & VAD State (Hands-Free ON by default)
  const [isVADListening, setIsVADListening] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(true); // Default mode: Hands-Free ON
  const [vadTranscript, setVadTranscript] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [spokenCaption, setSpokenCaption] = useState('');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handsFreeModeRef = useRef(handsFreeMode);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    handsFreeModeRef.current = handsFreeMode;
  }, [handsFreeMode]);

  // Auto-scroll to bottom of chat display
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying, vadTranscript, isAISpeaking]);

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

  // Clean Markdown utility
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

  // Stop SpeechSynthesis TTS
  const stopTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
    setActiveSpeakingMsgId(null);
    setSpokenCaption('');
    setHighlightedWordIndex(0);
    utteranceRef.current = null;
  };

  // Stop VAD Listening
  const stopVADListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsVADListening(false);
    setIsSpeechActive(false);
  };

  // Stop Voice Assistant completely (Command Interceptor)
  const stopVoiceAssistant = (message?: string) => {
    stopVADListening();
    setHandsFreeMode(false);
    stopTTS();
    setQueryInput('');
    setVadTranscript('');
    if (message) {
      speakAIResponse(message);
    }
  };

  // Clean up Audio and Voice Assistant on Unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopVADListening();
      stopTTS();
    };
  }, []);

  // Start VAD Listening
  const startVADListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    stopVADListening();
    stopTTS();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVADListening(true);
        setMicError(null);
        setVadTranscript('');
      };

      recognition.onspeechstart = () => {
        setIsSpeechActive(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const currentText = (finalText || interimText).trim();
        if (currentText) {
          // INTERCEPT CONTROL COMMANDS (e.g. "stop", "stop it", "okay stop it")
          if (checkIsStopCommand(currentText)) {
            stopVoiceAssistant("Voice Assistant paused. Hands-free loop disabled.");
            return;
          }

          setVadTranscript(currentText);
          setQueryInput(currentText);

          // Reset VAD silence timer: when speech pauses for 1200ms -> auto-submit!
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          silenceTimerRef.current = setTimeout(() => {
            if (currentText) {
              if (checkIsStopCommand(currentText)) {
                stopVoiceAssistant("Voice Assistant paused. Hands-free loop disabled.");
                return;
              }
              stopVADListening();
              handleQuerySubmit(currentText);
            }
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[VAD Error]", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError("Microphone access blocked. Please grant microphone permissions in your browser.");
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setMicError(`Speech Recognition error: ${event.error}`);
        }
        setIsVADListening(false);
        setIsSpeechActive(false);
      };

      recognition.onend = () => {
        setIsVADListening(false);
        setIsSpeechActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("[VAD Init Exception]", err);
      setMicError("Could not initialize microphone speech recognition.");
    }
  };

  // Speak AI Response via SpeechSynthesis with Live Captioning, Message Highlighting & Word Highlighting
  const speakAIResponse = (fullText: string, messageId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    stopTTS();
    if (!fullText || !fullText.trim()) return;

    const cleanText = fullText.replace(/[*_#`~]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) || voices.find(v => v.lang.startsWith('en'));
    if (naturalVoice) utterance.voice = naturalVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsAISpeaking(true);
      if (messageId) setActiveSpeakingMsgId(messageId);
      setSpokenCaption(cleanText);
      setHighlightedWordIndex(0);
    };

    utterance.onboundary = (event: any) => {
      if (event.name === 'word') {
        const textUpToBoundary = cleanText.substring(0, event.charIndex);
        const wordsSoFar = textUpToBoundary.trim().split(/\s+/).filter(Boolean).length;
        setHighlightedWordIndex(wordsSoFar);
      }
    };

    utterance.onend = () => {
      setIsAISpeaking(false);
      setActiveSpeakingMsgId(null);
      setSpokenCaption('');
      setHighlightedWordIndex(0);
      utteranceRef.current = null;

      // CONTINUOUS BACK-AND-FORTH LOOP: Re-start VAD listening for user's next spoken query!
      if (handsFreeModeRef.current) {
        setTimeout(() => {
          startVADListening();
        }, 700);
      }
    };

    utterance.onerror = (e) => {
      console.error("[TTS Error]", e);
      setIsAISpeaking(false);
      setActiveSpeakingMsgId(null);
      setSpokenCaption('');
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle TTS for a specific assistant ChatMessage
  const handleToggleMessageTTS = (msg: ChatMessage) => {
    if (activeSpeakingMsgId === msg.id) {
      stopTTS();
      return;
    }

    let fullText = msg.content || '';
    if (msg.sections && msg.sections.length > 0) {
      fullText = msg.sections.map(s => s.voice_explanation || s.visual_markdown).join('. ');
    }

    if (fullText) {
      speakAIResponse(fullText, msg.id);
    }
  };

  // Audio Playback Handler (/chat/synthesize)
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

  // Primary Chat Execution Handler (/chat/)
  const handleQuerySubmit = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || queryInput;
    if (!promptToSend.trim() || isQuerying) return;

    if (checkIsStopCommand(promptToSend)) {
      stopVoiceAssistant("Voice Assistant paused. Hands-free loop disabled.");
      return;
    }

    stopVADListening();
    stopTTS();

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setQueryInput('');
    setVadTranscript('');
    setIsQuerying(true);

    try {
      const res = await fetch(`${customApiUrl}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptToSend })
      });

      let sections: Section[] = [];
      let sources: Source[] = [];

      if (res.ok) {
        const data = await res.json();
        sections = data.response_sections || data.sections || [];
        sources = data.sources || [];
      } else {
        throw new Error(`Backend API returned an error status: ${res.status}`);
      }

      const assistantMsgId = `ast_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        sections: sections,
        sources: sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      recordTokenUsage('/chat/', 'gpt-4o-mini', 350, 280);

      // AUTOMATIC TEXT-TO-SPEECH (TTS) & CONTENT HIGHLIGHTING FOR RETURNED AI RESPONSE
      const spokenSummary = sections.map(s => s.voice_explanation || s.visual_markdown).join('. ');
      if (spokenSummary) {
        speakAIResponse(spokenSummary, assistantMsgId);
      }
    } catch (err: any) {
      const assistantMsgId = `ast_err_${Date.now()}`;
      const errorMsg: ChatMessage = {
        id: assistantMsgId,
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

  // Ingestion Handler (/document/upload)
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
                  setVadTranscript('');
                  stopTTS();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono font-bold hover:bg-rose-500/20 transition-all"
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

          {/* TAB 1: Chat Workspace (Vertical Page Layout: Top -> Middle -> Bottom) */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              {/* 1. TOP: Interactive Query Interface (Chat Log History Display) */}
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Interactive Query Interface</h3>

                <div className="min-h-[350px] max-h-[550px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
                  {messages.length === 0 ? (
                    <div className="p-12 text-center text-[var(--text-muted)]">
                      <BrainCircuit size={48} className="mx-auto text-amber-500/50 mb-3" />
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Workspace Idle</h3>
                      <p className="text-xs mt-1 max-w-md mx-auto">
                        Ask a query based on ingested vector context or submit a voice prompt using the microphone icon inside the input bar or Voice Assistant below.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, msgIdx) => {
                      const isMsgSpeaking = activeSpeakingMsgId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            msg.role === 'user'
                              ? 'bg-amber-500/10 border-amber-500/30 ml-8 text-[var(--text-primary)]'
                              : isMsgSpeaking
                              ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 mr-8 text-[var(--text-primary)] ring-2 ring-amber-500/30'
                              : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] mr-8 text-[var(--text-primary)]'
                          }`}
                        >
                          {/* Message Header & Dedicated Listen Icon Button */}
                          <div className="flex items-center justify-between text-xs mb-2 font-mono">
                            <span className="font-bold uppercase text-amber-500 flex items-center gap-1.5">
                              {msg.role === 'user' ? 'User Query' : <BrainCircuit className="w-3.5 h-3.5" />}
                              {msg.role === 'user' ? 'User Query' : 'Assistant Node Response'}
                            </span>

                            <div className="flex items-center gap-3">
                              {msg.role === 'assistant' && (
                                <button
                                  onClick={() => handleToggleMessageTTS(msg)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    isMsgSpeaking
                                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 animate-pulse'
                                      : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500/40'
                                  }`}
                                  title={isMsgSpeaking ? "Pause / Stop Audio" : "Listen / Replay Response"}
                                >
                                  <Volume2 className={`w-3.5 h-3.5 ${isMsgSpeaking ? 'animate-bounce text-slate-950' : 'text-amber-500'}`} />
                                  <span>{isMsgSpeaking ? "Pause" : "Listen"}</span>
                                </button>
                              )}
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">{msg.timestamp}</span>
                            </div>
                          </div>

                          {msg.content && <p className="text-sm font-semibold">{msg.content}</p>}

                          {msg.sections && (
                            <div className="space-y-4 mt-3">
                              {msg.sections.map((section, sIdx) => {
                                const componentKey = `msg_${msgIdx}_sec_${sIdx}`;
                                const isAudioActive = activeAudioKey === componentKey;
                                const visualContent = section.visual_markdown || "";

                                return (
                                  <div 
                                    key={sIdx} 
                                    className={`p-4 rounded-xl border space-y-2 transition-all ${
                                      isMsgSpeaking 
                                        ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-100 font-medium'
                                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
                                    }`}
                                  >
                                    {section.title && (
                                      <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
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
                                      <p className={`text-xs whitespace-pre-line leading-relaxed ${
                                        isMsgSpeaking ? 'text-amber-950 dark:text-amber-100 font-semibold' : 'text-[var(--text-secondary)]'
                                      }`}>
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
                      );
                    })
                  )}

                  {isQuerying && (
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-amber-500 font-mono flex items-center gap-2 animate-pulse">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Agentic pipeline executing graph workflow...</span>
                    </div>
                  )}

                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 2. MIDDLE: Primary Chat Input Bar with Embedded Microphone & Submit Button */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    placeholder={
                      isVADListening
                        ? 'Listening live... speak now (Say "Stop" anytime)'
                        : 'Ask anything based on your loaded documents...'
                    }
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                    disabled={isQuerying}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl pl-4 pr-12 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                  {/* Integrated Microphone Icon Button inside input bar */}
                  <button
                    type="button"
                    onClick={isVADListening ? () => stopVoiceAssistant("Voice assistant paused.") : startVADListening}
                    className={`absolute right-3 p-2 rounded-lg transition-all ${
                      isVADListening
                        ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                        : 'text-amber-500 hover:bg-[var(--bg-subtle)]'
                    }`}
                    title={isVADListening ? 'Stop Listening' : 'Start Continuous Voice Input (VAD)'}
                  >
                    {isVADListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>

                <button
                  onClick={() => handleQuerySubmit()}
                  disabled={isQuerying || !queryInput.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Send size={16} /> Query
                </button>
              </div>

              {/* 3. BOTTOM: Continuous Voice AI Assistant Panel (Hands-Free ON by default) */}
              <VoiceAssistantBar
                isVADListening={isVADListening}
                isSpeechActive={isSpeechActive}
                isAISpeaking={isAISpeaking}
                isQuerying={isQuerying}
                handsFreeMode={handsFreeMode}
                vadTranscript={vadTranscript}
                spokenCaption={spokenCaption}
                highlightedWordIndex={highlightedWordIndex}
                micError={micError}
                onToggleVAD={() => isVADListening ? stopVoiceAssistant("Voice assistant paused.") : startVADListening()}
                onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                onStopTTS={stopTTS}
                onClearError={() => setMicError(null)}
              />
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