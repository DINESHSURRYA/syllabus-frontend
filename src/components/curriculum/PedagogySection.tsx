"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, ChevronRight, Search, X } from "lucide-react";
import { PEDAGOGIES_CATALOG_DATA, CatalogPedagogyCategory } from "@/lib/data/pedagogies-catalog-data";
import { TeachingStrategiesModal } from "./TeachingStrategiesModal";

interface PedagogySectionProps {
  topicTitle?: string;
  pedagogies?: CatalogPedagogyCategory[];
}

export const PedagogySection: React.FC<PedagogySectionProps> = ({ topicTitle = "Computer Science Core", pedagogies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CatalogPedagogyCategory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const catalogGridRef = useRef<HTMLDivElement>(null);

  // Dynamic scroll listener to add .is-scrolling class for active scrollbar thumb pulse
  useEffect(() => {
    const el = catalogGridRef.current;
    if (!el) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      el.classList.add('is-scrolling');
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        el.classList.remove('is-scrolling');
      }, 700);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const catalogList = useMemo(() => {
    return pedagogies && pedagogies.length > 0 ? pedagogies : PEDAGOGIES_CATALOG_DATA;
  }, [pedagogies]);

  const filteredCategories = useMemo(() => {
    let list = catalogList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.strategies.some(s => s.strategyName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      );
    }

    if (selectedFilter !== 'All') {
      list = list.filter(c => c.teachingStyle.toLowerCase().includes(selectedFilter.toLowerCase()));
    }

    return list;
  }, [catalogList, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 my-4 p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 eyecomfort:text-amber-300 font-mono text-xs font-extrabold shadow-xs">
            <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 eyecomfort:text-amber-400" /> 30-Category Pedagogy Taxonomy Catalog
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Pedagogy Catalog & Teaching Methods Repository
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
            Explore 30 instructional pedagogy categories with over 150+ actionable classroom teaching strategies tailored for syllabus optimization.
          </p>
        </div>

        {/* Live Catalog Search */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 dark:text-cyan-400 eyecomfort:text-amber-400" />
          <input
            type="text"
            placeholder="Search categories or strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-xs font-mono font-bold bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl outline-none focus:border-cyan-500 dark:focus:border-cyan-400 shadow-inner transition-all placeholder:text-[var(--text-muted)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Scrollable Grid of 30 Pedagogy Categories with Clean Spacing & Alignment */}
      <div 
        ref={catalogGridRef}
        className="max-h-[72vh] overflow-y-auto pr-3 custom-scrollbar"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((ped) => (
            <div 
              key={ped.id}
              onClick={() => setSelectedCategory(ped)}
              className="cursor-pointer group border border-[var(--border-subtle)] hover:border-cyan-500/60 dark:hover:border-cyan-400/60 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] shadow-md hover:shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[11px] font-mono font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-xs">
                    #{ped.number} Category
                  </span>
                  <span className="text-[11px] font-mono font-extrabold text-emerald-900 dark:text-emerald-300 eyecomfort:text-amber-300 bg-emerald-100 dark:bg-emerald-500/20 eyecomfort:bg-amber-500/20 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 eyecomfort:border-amber-500/40">
                    {ped.strategies.length} Strategies
                  </span>
                </div>
                
                <h4 className="text-lg font-black text-[var(--text-primary)] group-hover:text-cyan-700 dark:group-hover:text-cyan-400 eyecomfort:group-hover:text-amber-400 transition-colors tracking-tight leading-snug">
                  {ped.category}
                </h4>
                
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed font-medium">
                  {ped.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <div className="text-[11px] text-[var(--text-muted)] truncate pr-2">
                  Style: <strong className="text-[var(--text-primary)] font-bold">{ped.teachingStyle}</strong>
                </div>
                <div className="flex items-center text-cyan-700 dark:text-cyan-400 eyecomfort:text-amber-400 font-extrabold font-mono text-[11px] shrink-0 group-hover:translate-x-1 transition-transform">
                  View Methods <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pedagogy Category Dialog / Modal */}
      <TeachingStrategiesModal
        category={selectedCategory}
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
};