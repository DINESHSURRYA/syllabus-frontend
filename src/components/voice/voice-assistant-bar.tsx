"use client";

import React from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Loader2, 
  Radio, 
  AlertCircle,
  Repeat,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAssistantBarProps {
  isVADListening: boolean;
  isSpeechActive: boolean;
  isAISpeaking: boolean;
  isQuerying: boolean;
  handsFreeMode: boolean;
  vadTranscript: string;
  spokenCaption: string;
  highlightedWordIndex: number;
  micError: string | null;
  onToggleVAD: () => void;
  onToggleHandsFree: () => void;
  onStopTTS: () => void;
  onClearError: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  isVADListening,
  isSpeechActive,
  isAISpeaking,
  isQuerying,
  handsFreeMode,
  vadTranscript,
  spokenCaption,
  highlightedWordIndex,
  micError,
  onToggleVAD,
  onToggleHandsFree,
  onStopTTS,
  onClearError
}) => {
  // Split spoken caption into words for real-time visual word highlighting
  const words = spokenCaption ? spokenCaption.split(/\s+/) : [];

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 px-2 select-none">
      <AnimatePresence>
        {/* Error Notification Banner */}
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              onClick={onClearError}
              className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 font-semibold text-[11px] transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Continuous Voice AI Assistant Panel */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 dark:from-amber-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 border border-amber-500/30 dark:border-amber-500/20 shadow-xl backdrop-blur-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isAISpeaking
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 animate-pulse'
                    : isVADListening
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-bounce'
                    : isQuerying
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isAISpeaking ? (
                  <Volume2 className="w-5 h-5" />
                ) : isVADListening ? (
                  <Mic className="w-5 h-5 animate-pulse" />
                ) : isQuerying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Radio className="w-5 h-5" />
                )}
              </div>
              {(isVADListening || isAISpeaking) && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  Voice AI Assistant
                </h4>
                {handsFreeMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Repeat className="w-3 h-3 animate-spin-slow" />
                    Hands-Free Loop
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAISpeaking
                  ? 'Speaking response...'
                  : isQuerying
                  ? 'Processing AI doubt resolution...'
                  : isVADListening
                  ? isSpeechActive
                    ? 'Capturing live voice input in real-time...'
                    : 'Listening... Speak your question'
                  : 'Click Start Voice or inline mic to begin voice interaction'}
              </p>
            </div>
          </div>

          {/* Assistant Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Hands-Free Loop Mode Toggle Switch */}
            <button
              onClick={onToggleHandsFree}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                handsFreeMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
              title="Auto-restart microphone after AI finishes speaking for hands-free conversation"
            >
              <Repeat className={`w-3.5 h-3.5 ${handsFreeMode ? 'animate-spin-slow' : ''}`} />
              <span>{handsFreeMode ? 'Hands-Free ON' : 'Hands-Free OFF'}</span>
            </button>

            {/* Stop TTS Button (if speaking) */}
            {isAISpeaking && (
              <button
                onClick={onStopTTS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/30 hover:bg-rose-600 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Audio</span>
              </button>
            )}

            {/* Continuous VAD Mic Toggle Button */}
            <button
              onClick={onToggleVAD}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isVADListening
                  ? 'bg-rose-500 text-white shadow-rose-500/20 animate-pulse hover:bg-rose-600'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isVADListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Assistant</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Visual Wave & Live Captions */}
        <div className="pt-3 space-y-2">
          {/* Audio Visualizer Equalizer Bars (When Listening or Speaking) */}
          {(isVADListening || isAISpeaking) && (
            <div className="flex items-center justify-center gap-1 h-8 my-1">
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 1.3, 0.7, 0.3].map((delay, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full ${
                    isAISpeaking
                      ? 'bg-purple-500 dark:bg-purple-400'
                      : 'bg-emerald-500 dark:bg-emerald-400'
                  } animate-voice-bar`}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          )}

          {/* Real-time Live Spoken Query Display Panel */}
          {(isVADListening || vadTranscript) && (
            <div className="p-3 rounded-xl bg-slate-900/80 dark:bg-slate-950/90 border border-emerald-500/40 text-xs shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Live Spoken Query:
                </span>
                {isVADListening && (
                  <span className="text-[10px] text-emerald-400/80 font-mono italic animate-pulse">
                    Auto-submits on pause...
                  </span>
                )}
              </div>
              <p className="text-slate-100 font-medium italic min-h-[22px] leading-relaxed">
                {vadTranscript ? (
                  <span className="text-emerald-300 font-semibold">{vadTranscript}</span>
                ) : (
                  <span className="text-slate-400">Speak your doubt clearly into your microphone...</span>
                )}
              </p>
            </div>
          )}

          {/* Real-time AI Voice Response Captioning & Word Highlighting */}
          {isAISpeaking && spokenCaption && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 dark:bg-slate-950/90 border border-purple-500/40 text-xs shadow-inner">
              <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px] block mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                Live AI Spoken Caption:
              </span>
              <div className="text-slate-100 font-medium leading-relaxed flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {words.map((word, wIdx) => {
                  const isHighlighted = wIdx === highlightedWordIndex;
                  return (
                    <span
                      key={wIdx}
                      className={`transition-all duration-150 px-1 py-0.5 rounded ${
                        isHighlighted
                          ? 'bg-amber-400 text-slate-950 font-bold scale-105 shadow-md shadow-amber-400/40 ring-2 ring-amber-400/60'
                          : wIdx < highlightedWordIndex
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
