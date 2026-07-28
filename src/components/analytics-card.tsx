"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import Link from 'next/link';

interface AnalyticsCardProps {
  title: string;
  value: string;
  detail?: string;
  delta?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function AnalyticsCard({ title, value, detail, delta, href, onClick, className }: AnalyticsCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={href || onClick ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`group rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 backdrop-blur-2xl shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all ${
        href || onClick ? 'cursor-pointer' : ''
      } ${className || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-400 uppercase tracking-wider font-bold group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-full border border-indigo-300 dark:border-indigo-500/40 bg-indigo-100 dark:bg-indigo-950/80 p-2 text-indigo-900 dark:text-indigo-200 shadow-sm group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-black transition-colors">
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
      <p className="mt-4 text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold border-t border-slate-200 dark:border-white/5 pt-2">
        {detail ?? delta}
      </p>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
