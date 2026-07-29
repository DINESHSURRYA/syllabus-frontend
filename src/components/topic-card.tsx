"use client";
import './styles/topic-card.css';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Sparkles, Tag, Info } from 'lucide-react';

export interface PedagogyItem {
  title?: string;
  name?: string;
  pedagogyName?: string;
  type?: string;
  description?: string;
  reason?: string;
  rationale?: string;
  confidence?: number;
  confidenceScore?: number;
}

export interface SubtopicItem {
  title: string;
  reason?: string;
  hierarchyReason?: string;
}

export interface TopicData {
  id?: string;
  title: string;
  description?: string;
  confidence?: number;
  orderingReason?: string;
  hierarchyReason?: string;
  similarTopics?: string[];
  subtopics?: SubtopicItem[];
  pedagogies?: PedagogyItem[];
  top3Pedagogies?: PedagogyItem[];
}

interface TopicCardProps {
  topic?: TopicData;
  title?: string;
  description?: string;
  confidence?: number;
  pedagogies?: PedagogyItem[];
}

export function TopicCard(props: TopicCardProps) {
  const [showPedagogies, setShowPedagogies] = useState(false);

  // Normalize topic object or individual props
  const topic: TopicData = props.topic || {
    title: props.title || "Main Topic Name",
    description: props.description || "",
    confidence: props.confidence ?? 92,
    pedagogies: props.pedagogies || [],
  };

  const title = topic.title;
  const orderingReason = topic.orderingReason || topic.hierarchyReason;
  const similarTopics = topic.similarTopics || [];
  const subtopics = topic.subtopics || [];
  const pedagogiesList = topic.pedagogies || topic.top3Pedagogies || props.pedagogies || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="semantic-card rounded-[24px] p-5 backdrop-blur-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm mb-4"
    >
      {/* Main Topic Header */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-subtle)]">
            <Sparkles size={12} /> TOPIC RECOMMENDATION
          </span>
          <h4 className="font-bold text-lg text-[var(--text-primary)]">{title}</h4>
        </div>

        {/* Click Action to Reveal Pedagogies */}
        <button
          onClick={() => setShowPedagogies(!showPedagogies)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-mono font-bold transition-all shadow-sm shrink-0"
        >
          ✨ {showPedagogies ? "Hide Pedagogies" : "Top 3 Pedagogies"}
        </button>
      </div>

      {/* Description if present */}
      {topic.description && (
        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
          {topic.description}
        </p>
      )}

      {/* Related Concepts / Similar Topics */}
      {similarTopics.length > 0 && (
        <div className="mt-2 text-xs text-purple-700 flex flex-wrap gap-1.5 items-center">
          <span className="font-mono text-[11px] font-bold flex items-center gap-1 mr-1">
            <Tag size={12} /> Related Concepts:
          </span>
          {similarTopics.map((tag, idx) => (
            <span key={idx} className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[11px] font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Hierarchy Ordering Reason Callout */}
      {orderingReason && (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-400 p-2.5 text-xs text-blue-900 dark:text-blue-200 rounded-r-lg">
          <strong className="font-mono flex items-center gap-1 text-[11px] uppercase tracking-wider mb-0.5">
            <Info size={13} /> Hierarchy Ordering Reason:
          </strong> 
          <p className="leading-relaxed">{orderingReason}</p>
        </div>
      )}

      {/* Nested Subtopics */}
      {subtopics.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 font-mono">
            Nested Subtopics ({subtopics.length}):
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subtopics.map((sub, i) => (
              <div key={i} className="border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs bg-[var(--bg-subtle)]">
                <span className="font-semibold text-[var(--text-primary)]">• {sub.title}</span>
                {sub.reason && (
                  <p className="text-[var(--text-muted)] text-[10px] mt-0.5">{sub.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVEALABLE PEDAGOGIES SECTION (Only renders if clicked) */}
      <AnimatePresence>
        {showPedagogies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl"
          >
            <h5 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-2.5 flex items-center gap-1.5 font-mono">
              💡 Recommended Top 3 Pedagogies
            </h5>
            <div className="space-y-2">
              {pedagogiesList.map((ped, idx) => {
                const pedTitle = ped.title || ped.pedagogyName || ped.name || `Pedagogy ${idx + 1}`;
                const pedType = ped.type || "Teaching Strategy";
                const pedDesc = ped.description || ped.rationale || ped.reason || "";
                const pedConf = ped.confidenceScore ?? ped.confidence ?? 90;

                return (
                  <div key={idx} className="bg-white dark:bg-[var(--bg-card)] p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        {idx + 1}. {pedTitle}
                      </span>{" "}
                      <span className="text-gray-400 text-[11px]">({pedType})</span>
                    </div>
                    {pedDesc && <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{pedDesc}</p>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TopicCard;
