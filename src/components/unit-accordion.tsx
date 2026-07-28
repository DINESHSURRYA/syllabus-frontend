"use client";

import { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, Edit3, Plus, Trash2, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyllabusStore, UnitItem, TopicItem } from '@/lib/store';

export function UnitAccordion() {
  const {
    syllabus,
    updateUnit,
    deleteUnit,
    addUnit,
    reorderUnits,
    addTopic,
    updateTopic,
    deleteTopic
  } = useSyllabusStore();

  const [editingUnitIdx, setEditingUnitIdx] = useState<number | null>(null);
  const [unitDraft, setUnitDraft] = useState({ title: '', hours: '' });

  const [editingTopicKey, setEditingTopicKey] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState({ name: '', subtopicsStr: '', level: 'Concept', hierarchyReason: '' });

  const [newTopicName, setNewTopicName] = useState<{ [unitIdx: number]: string }>({});

  const startEditUnit = (idx: number, unit: UnitItem) => {
    setEditingUnitIdx(idx);
    setUnitDraft({ title: unit.title, hours: String(unit.hours || '9') });
  };

  const saveUnitEdit = (idx: number) => {
    updateUnit(idx, { title: unitDraft.title, hours: unitDraft.hours });
    setEditingUnitIdx(null);
  };

  const startEditTopic = (unitIdx: number, topicIdx: number, topic: TopicItem) => {
    setEditingTopicKey(`${unitIdx}-${topicIdx}`);
    setTopicDraft({
      name: topic.name,
      subtopicsStr: Array.isArray(topic.subtopics) ? topic.subtopics.join(', ') : '',
      level: topic.level || 'Concept',
      hierarchyReason: topic.hierarchyReason || ''
    });
  };

  const saveTopicEdit = (unitIdx: number, topicIdx: number) => {
    const subArr = topicDraft.subtopicsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateTopic(unitIdx, topicIdx, {
      name: topicDraft.name,
      subtopics: subArr,
      level: topicDraft.level,
      hierarchyReason: topicDraft.hierarchyReason
    });
    setEditingTopicKey(null);
  };

  const handleAddNewUnit = () => {
    const nextNum = syllabus.units.length + 1;
    const newUnit: UnitItem = {
      unit_number: nextNum,
      title: `Unit ${nextNum}: New Unit Title`,
      hours: '9',
      topics: [
        {
          name: 'Core Topic 1',
          subtopics: ['Fundamental Subtopic A', 'Fundamental Subtopic B']
        }
      ]
    };
    addUnit(newUnit);
  };

  const handleAddNewTopic = (unitIdx: number) => {
    const tName = newTopicName[unitIdx]?.trim() || 'New Topic Name';
    addTopic(unitIdx, {
      name: tName,
      subtopics: ['Subtopic 1', 'Subtopic 2']
    });
    setNewTopicName({ ...newTopicName, [unitIdx]: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold dark:text-slate-300 text-slate-800 font-mono">Total Units: {syllabus.units.length}</p>
        <Button onClick={handleAddNewUnit} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
          <Plus size={14} className="mr-1" /> Add Unit
        </Button>
      </div>

      <Accordion.Root type="multiple" defaultValue={syllabus.units.map((u, i) => `unit-${i}`)} className="space-y-3">
        {syllabus.units.map((unit, unitIdx) => (
          <Accordion.Item key={`unit-${unitIdx}`} value={`unit-${unitIdx}`} className="overflow-hidden rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-black/70 bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <Accordion.Header>
              <div className="flex items-center justify-between px-4 py-3.5 border-b dark:border-white/10 border-slate-200 dark:bg-black/40 bg-slate-50/80">
                <Accordion.Trigger className="flex flex-1 items-center justify-between text-left pr-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider dark:text-indigo-400 text-indigo-700">
                      Unit {unit.unit_number || unitIdx + 1} &bull; {unit.hours || 9} Hours
                    </span>
                    <p className="text-base font-bold dark:text-slate-100 text-slate-900 mt-0.5">{unit.title}</p>
                  </div>
                  <ChevronDown className="dark:text-slate-400 text-slate-700" size={18} />
                </Accordion.Trigger>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={unitIdx === 0}
                    onClick={() => reorderUnits(unitIdx, unitIdx - 1)}
                    title="Move Unit Up"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={unitIdx === syllabus.units.length - 1}
                    onClick={() => reorderUnits(unitIdx, unitIdx + 1)}
                    title="Move Unit Down"
                  >
                    <ArrowDown size={14} />
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => startEditUnit(unitIdx, unit)}>
                    <Edit3 size={14} className="dark:text-slate-300 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteUnit(unitIdx)}>
                    <Trash2 size={14} className="text-rose-500" />
                  </Button>
                </div>
              </div>
            </Accordion.Header>

            <Accordion.Content>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
                {editingUnitIdx === unitIdx && (
                  <div className="rounded-xl border dark:border-indigo-500/40 border-indigo-200 dark:bg-indigo-950/40 bg-indigo-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold dark:text-indigo-300 text-indigo-700 font-mono">Edit Unit Details</p>
                    <input
                      type="text"
                      value={unitDraft.title}
                      onChange={(e) => setUnitDraft({ ...unitDraft, title: e.target.value })}
                      className="w-full rounded-xl border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-white p-2.5 text-sm dark:text-white text-slate-900"
                      placeholder="Unit Title"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={unitDraft.hours}
                        onChange={(e) => setUnitDraft({ ...unitDraft, hours: e.target.value })}
                        className="w-28 rounded-xl border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-white p-2.5 text-sm dark:text-white text-slate-900"
                        placeholder="Teaching Hours"
                      />
                      <span className="text-xs dark:text-slate-400 text-slate-600">Hours</span>
                      <Button size="sm" onClick={() => saveUnitEdit(unitIdx)}><Check size={14} /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUnitIdx(null)}><X size={14} /> Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {unit.topics.map((topic, topicIdx) => {
                    const isEditingTopic = editingTopicKey === `${unitIdx}-${topicIdx}`;

                    return (
                      <div key={topicIdx} className="rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-black/50 bg-white p-4 space-y-3 shadow-sm hover:border-indigo-300 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded-full bg-indigo-100 text-indigo-950 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase">
                                {topic.level || 'Concept'}
                              </span>
                              {topic.type && (
                                <span className="rounded-full bg-indigo-100 text-indigo-950 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                                  {topic.type}
                                </span>
                              )}
                            </div>
                            <p className="font-bold dark:text-slate-100 text-slate-900 text-base mt-1">{topic.name}</p>

                            {/* Hierarchy Reason Callout */}
                            {topic.hierarchyReason && (
                              <div className="mt-2 flex items-start gap-2 rounded-xl border dark:border-indigo-500/30 border-indigo-200 dark:bg-indigo-950/40 bg-indigo-50 p-2.5 text-xs text-slate-800 dark:text-slate-300 font-medium">
                                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-mono font-bold text-[10px] uppercase text-indigo-700 dark:text-indigo-300 block mb-0.5">Hierarchy Reason</span>
                                  <span>{topic.hierarchyReason}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEditTopic(unitIdx, topicIdx, topic)}>
                              <Edit3 size={14} className="dark:text-slate-400 text-slate-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteTopic(unitIdx, topicIdx)}>
                              <Trash2 size={14} className="text-rose-500" />
                            </Button>
                          </div>
                        </div>

                        {isEditingTopic ? (
                          <div className="space-y-3 rounded-xl border dark:border-white/10 border-slate-300 dark:bg-black bg-white p-3">
                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">Topic Title</label>
                              <input
                                type="text"
                                value={topicDraft.name}
                                onChange={(e) => setTopicDraft({ ...topicDraft, name: e.target.value })}
                                className="w-full rounded-lg border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-slate-50 p-2 text-sm dark:text-white text-slate-900"
                                placeholder="Topic Name"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">Hierarchy Level (Taxonomy)</label>
                              <select
                                value={topicDraft.level || 'Concept'}
                                onChange={(e) => setTopicDraft({ ...topicDraft, level: e.target.value })}
                                className="w-full rounded-lg border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-slate-50 p-2 text-xs dark:text-white text-slate-900"
                              >
                                <option value="Learning Module">Learning Module</option>
                                <option value="Learning Category">Learning Category</option>
                                <option value="Concept">Concept</option>
                                <option value="Topic">Topic</option>
                                <option value="Subtopic">Subtopic</option>
                                <option value="Micro Topic">Micro Topic</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">Hierarchy Reason (Educational Justification)</label>
                              <textarea
                                value={topicDraft.hierarchyReason || ''}
                                onChange={(e) => setTopicDraft({ ...topicDraft, hierarchyReason: e.target.value })}
                                className="w-full rounded-lg border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-slate-50 p-2 text-xs dark:text-white text-slate-900"
                                placeholder="Explain why this topic belongs at this hierarchy level under its parent unit/topic..."
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">Subtopics (comma-separated)</label>
                              <textarea
                                value={topicDraft.subtopicsStr}
                                onChange={(e) => setTopicDraft({ ...topicDraft, subtopicsStr: e.target.value })}
                                className="w-full rounded-lg border dark:border-white/10 border-slate-300 dark:bg-black/80 bg-slate-50 p-2 text-xs dark:text-white text-slate-900"
                                placeholder="Subtopics (comma-separated)"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveTopicEdit(unitIdx, topicIdx)}><Check size={14} /> Save Topic</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingTopicKey(null)}><X size={14} /> Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {topic.subtopics && topic.subtopics.map((sub, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2 rounded-xl border dark:border-white/10 border-slate-200 dark:bg-slate-900 bg-white px-3 py-2 text-xs font-semibold dark:text-slate-300 text-slate-800 shadow-sm">
                                <Sparkles size={12} className="dark:text-indigo-400 text-indigo-600" />
                                {typeof sub === 'string' ? sub : (sub as any).title || 'Subtopic'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t dark:border-white/10 border-slate-200">
                  <input
                    type="text"
                    value={newTopicName[unitIdx] || ''}
                    onChange={(e) => setNewTopicName({ ...newTopicName, [unitIdx]: e.target.value })}
                    placeholder="New topic title..."
                    className="flex-1 rounded-xl border dark:border-white/10 border-slate-300 dark:bg-slate-900 bg-white px-3.5 py-2 text-xs dark:text-white text-slate-900 outline-none focus:border-indigo-500"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleAddNewTopic(unitIdx)}>
                    <Plus size={14} className="mr-1" /> Add Topic
                  </Button>
                </div>
              </motion.div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
