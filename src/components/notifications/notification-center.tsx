"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Sparkles, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Topic Hierarchy Ready',
      message: 'Independent topic hierarchy generated successfully for saved syllabus.',
      type: 'success',
      timestamp: 'Just now',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Timeline Allocated',
      message: 'Teaching timeline allocated 45 hours across topics.',
      type: 'success',
      timestamp: '2 mins ago',
      read: false,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700/80 hover:text-white transition shadow-sm"
        title="Notifications"
      >
        <Bell className="h-4 w-4 text-indigo-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/50 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-outside backdrop overlay */}
            <div 
              className="fixed inset-0 z-[9998] bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/80 p-4 shadow-2xl z-[9999] text-slate-100 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-100">AI Task Notifications</h4>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-medium text-indigo-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-sidebar-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl border p-3 text-xs transition ${
                        n.read ? 'bg-slate-950/40 border-slate-800/60 opacity-80' : 'bg-slate-800/60 border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{n.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
