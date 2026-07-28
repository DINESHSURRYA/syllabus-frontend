"use client";

import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Brain, Layers3, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { CurriculumTopic } from '@/lib/services/curriculum-service';
import { DifficultyBadge, ImportanceBadge, HoursBadge } from '@/components/ui/status-badge';
import { HierarchySkeleton } from '@/components/ui/skeleton';

const nodeIcons = {
  course: BookOpen,
  unit: Layers3,
  topic: Sparkles,
  concept: Brain,
};

interface HierarchyTreeProps {
  topics?: CurriculumTopic[];
  isLoading?: boolean;
  onSelectPedagogy?: (pedagogyName: string, topicTitle: string, reason?: string) => void;
}

export function HierarchyTree({ topics = [], isLoading = false, onSelectPedagogy }: HierarchyTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return <HierarchySkeleton />;
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <AlertCircle className="w-8 h-8 text-[var(--text-muted)] mb-2" />
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">No curriculum topics found</h4>
        <p className="text-xs text-[var(--text-muted)] mt-1">Try adjusting your search term or difficulty filter.</p>
      </div>
    );
  }

  const renderNode = (node: CurriculumTopic, level = 0) => {
    const Icon = nodeIcons[node.type as keyof typeof nodeIcons] ?? Sparkles;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;

    return (
      <div key={node.id} className="ml-2 border-l border-[var(--border-subtle)] pl-4">
        <div
          onClick={() => hasChildren && setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }))}
          className={`mt-3 flex w-full items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left shadow-sm transition-all duration-200 ${
            hasChildren ? 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-md' : ''
          }`}
        >
          <div className="rounded-xl bg-[var(--bg-hover)] p-2 text-[var(--text-accent)] border border-[var(--border-subtle)]">
            <Icon size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {hasChildren ? (
                  <ChevronRight
                    size={16}
                    className={`transition-transform duration-200 text-[var(--text-muted)] ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                ) : (
                  <span className="w-4" />
                )}
                <span className="rounded-full bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                  {node.level || node.type}
                </span>
                <p className="font-bold text-[var(--text-primary)] text-base">{node.title}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{node.description}</p>

            {/* Hierarchy Reason Callout */}
            {node.hierarchyReason && (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-secondary)]">
                <Sparkles size={14} className="text-[var(--text-accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-[10px] uppercase text-[var(--text-accent)] block mb-0.5">Hierarchy Reason</span>
                  <span>{node.hierarchyReason}</span>
                </div>
              </div>
            )}

            {/* Compact Pedagogy Badges (Click to open Slide-over Drawer / Modal) */}
            {node.pedagogies && node.pedagogies.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold flex items-center gap-1">
                  <Sparkles size={11} className="text-cyan-400" /> Pedagogies:
                </span>
                {node.pedagogies.slice(0, 3).map((ped, pIdx) => {
                  const stratName = ped.method || ped.name || 'Active Learning';
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPedagogy) {
                          onSelectPedagogy(stratName, node.title, ped.reason);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer shadow-xs"
                    >
                      <span>#{ped.rank || pIdx + 1}</span>
                      <span>{stratName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DifficultyBadge level={node.difficulty} />
              <ImportanceBadge importance={node.importance} />
              {node.type === 'unit' && node.learningHours && <HoursBadge hours={node.learningHours} />}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="ml-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </motion.div>
        ) : null}
      </div>
    );
  };

  return <div className="space-y-2">{topics.map((node) => renderNode(node))}</div>;
}
