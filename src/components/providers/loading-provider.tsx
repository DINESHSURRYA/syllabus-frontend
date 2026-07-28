"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  triggerLoading: (message?: string, durationMs?: number) => void;
  startProcessing: (message?: string) => void;
  stopProcessing: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  loadingMessage: 'INITIALIZING SYLLABUS ENGINE...',
  triggerLoading: () => {},
  startProcessing: () => {},
  stopProcessing: () => {},
});

export const useGlobalLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('INITIALIZING SYLLABUS MATRIX...');
  const [progress, setProgress] = useState(100);

  // Fast & instant route transition handling - zero artificial 3-second delays
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const triggerLoading = (message = 'PROCESSING MATRIX...', durationMs = 400) => {
    setLoadingMessage(message);
    setProgress(30);
    setIsLoading(true);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 35));
    }, durationMs / 3);

    setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        clearInterval(interval);
      }, 100);
    }, durationMs);
  };

  const startProcessing = (message = 'AI PROCESSING IN PROGRESS...') => {
    setLoadingMessage(message);
    setProgress(40);
    setIsLoading(true);
  };

  const stopProcessing = () => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        triggerLoading,
        startProcessing,
        stopProcessing,
      }}
    >
      {children}

      {/* Modern Clean Processing Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/80 text-white overflow-hidden pointer-events-auto backdrop-blur-lg"
          >
            {/* Subtle Gradient Glow Backdrop */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0,transparent_70%)]" />

            {/* Modern Processing Card */}
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
              className="relative z-20 w-full max-w-sm p-6 rounded-3xl border border-indigo-500/40 bg-slate-950/95 text-center shadow-2xl mx-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/15 text-xs font-mono text-indigo-300 mb-3">
                <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '2s' }} />
                <span>PROCESSING</span>
              </div>

              <div className="flex items-center justify-center gap-2 font-mono text-xs text-indigo-400 my-2 font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>{loadingMessage}</span>
              </div>

              <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  className="bg-indigo-600 h-full rounded-full shadow-sm"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}
