"use client";
import React, { useState, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsePanelProps {
  onSubmit: (answerText: string) => void;
  isSubmitting?: boolean;
  autoSubmitSignal?: number;
}

export default function ResponsePanel({ onSubmit, isSubmitting, autoSubmitSignal }: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<'type' | 'speak'>('type');
  const [textAnswer, setTextAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [glow, setGlow] = useState(false);
  
  // Speech Recognition State
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (autoSubmitSignal && autoSubmitSignal > 0) {
      if (isRecording && recognition) {
        try { recognition.stop(); } catch(e) {}
        setIsRecording(false);
      }
      const finalAns = textAnswer.trim() || "No response (Time expired)";
      onSubmit(finalAns);
      setTextAnswer('');
      if (activeTab === 'speak') {
        setActiveTab('type');
      }
    }
  }, [autoSubmitSignal]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        setRecognition(rec);
      }
    }
  }, []);

  const handleSubmit = () => {
    if (textAnswer.trim()) {
      onSubmit(textAnswer);
      setTextAnswer(''); // Reset for next question
      if (activeTab === 'speak') {
        setActiveTab('type'); // Switch back to type for next Q
      }
    }
  };

  const handleMicToggle = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (!isRecording) {
      setIsRecording(true);
      const currentText = textAnswer ? textAnswer + " " : "";
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTextAnswer(currentText + finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const canSubmit = textAnswer.trim().length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 flex flex-col items-center">
      <div className="flex bg-surface/10 rounded-full p-1 mb-6">
        <button
          onClick={() => setActiveTab('type')}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all focus:outline-none cursor-pointer",
            activeTab === 'type' ? "bg-surface text-background shadow-md" : "text-surface/70 hover:text-surface"
          )}
        >
          Type
        </button>
        <button
          onClick={() => setActiveTab('speak')}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all focus:outline-none cursor-pointer",
            activeTab === 'speak' ? "bg-surface text-background shadow-md" : "text-surface/70 hover:text-surface"
          )}
        >
          Speak
        </button>
      </div>

      <div 
        className={cn(
          "w-full bg-surface/5 border rounded-2xl p-6 min-h-[160px] flex flex-col relative transition-all duration-300",
          glow && activeTab === 'type' ? "border-accent shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-surface/10"
        )}
      >
        {activeTab === 'type' ? (
          <textarea
            className="w-full flex-1 bg-transparent border-none resize-none text-surface placeholder:text-surface/30 focus:outline-none focus:ring-0 text-lg custom-scrollbar"
            placeholder="Type your response here..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={isSubmitting}
            onFocus={() => setGlow(true)}
            onBlur={() => setGlow(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <button
                onClick={handleMicToggle}
                disabled={isSubmitting}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-accent/50 cursor-pointer",
                  isRecording ? "bg-error text-surface animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : 
                  "bg-surface/20 text-surface hover:bg-accent hover:text-background"
                )}
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-xs text-muted mt-3 text-center">
                {isRecording ? "Recording... tap to stop" : "Tap to speak"}
              </p>
            </div>
            
            <div className="flex-1 w-full bg-background/30 rounded-xl p-4 border border-surface/5 h-full min-h-[100px] flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-surface/50 mb-2 font-mono">Live Transcription</span>
              <textarea
                className="w-full flex-1 bg-transparent border-none resize-none text-surface/90 focus:outline-none focus:ring-0 text-md custom-scrollbar"
                placeholder={isRecording ? "Listening..." : "Your transcribed speech will appear here. You can also edit it manually."}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer",
              canSubmit && !isSubmitting
                ? "bg-accent text-background hover:bg-accent/90 shadow-md transform hover:-translate-y-0.5"
                : "bg-surface/10 text-surface/30 cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Submitting..." : "Submit & Next Question"}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { ResponsePanel };
