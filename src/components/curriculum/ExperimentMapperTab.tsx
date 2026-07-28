"use client";

import React, { useState } from "react";
import { FlaskConical, ArrowRightLeft, BookOpen, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ExperimentMapperTabProps {
  courseId?: string;
  experiments?: any[];
}

export const ExperimentMapperTab: React.FC<ExperimentMapperTabProps> = ({ experiments = [] }) => {
  const [selectedExp, setSelectedExp] = useState<any>(null);

  const defaultExps = [
    {
      id: "exp_1",
      title: "Implementation of Stack and Queue Data Structures using Pointers",
      unit: "Unit II: Linear Data Structures",
      topics: ["Pointers", "Dynamic Memory Allocation", "Stack Operations"],
      co: "CO2: Ability to design and implement linear data structures.",
      materials: ["GCC Compiler", "GDB Debugger", "Workstation PC"]
    },
    {
      id: "exp_2",
      title: "Memory Allocation & Leak Auditing with Valgrind",
      unit: "Unit III: Memory Management",
      topics: ["Heap Memory", "malloc/free", "Pointer Dereferencing"],
      co: "CO3: Ability to diagnose system memory leaks and optimize performance.",
      materials: ["Valgrind", "Linux VM", "GCC"]
    },
    {
      id: "exp_3",
      title: "Binary Search Tree Construction & Traversal Algorithm Execution",
      unit: "Unit IV: Non-Linear Data Structures",
      topics: ["Binary Trees", "Recursion", "Node Pointers"],
      co: "CO4: Ability to construct and evaluate hierarchical data structures.",
      materials: ["C/C++ Compiler", "Automated Test Suite"]
    }
  ];

  const displayList = experiments.length > 0 ? experiments : defaultExps;

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            Bidirectional Experiment & Practical Mapping Matrix
          </CardTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Maps lab experiments to syllabus units, topics, subtopics, and Course Outcomes (COs). Reverse mapping allows exploring which experiments reinforce a target concept.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayList.map((exp, idx) => (
              <div 
                key={exp.id || idx}
                onClick={() => setSelectedExp(exp)}
                className={`cursor-pointer p-4 rounded-xl border transition-all text-xs space-y-2 ${
                  selectedExp?.id === exp.id
                    ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                    : "border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-indigo-400">Exp #{idx + 1}</span>
                  <ArrowRightLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <h4 className="font-bold text-[var(--text-primary)] text-sm">{exp.title}</h4>
                <p className="text-[var(--text-muted)]">Linked Unit: <strong className="text-[var(--text-primary)]">{exp.unit || exp.linkedUnits?.[0]}</strong></p>
              </div>
            ))}
          </div>

          {/* Selected Experiment Mapping Detail */}
          {selectedExp && (
            <div className="mt-6 p-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-indigo-500/20 pb-3">
                <div>
                  <span className="text-indigo-400 font-mono font-bold">Selected Experiment Mapping</span>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">{selectedExp.title}</h3>
                </div>
                <button onClick={() => setSelectedExp(null)} className="text-[var(--text-muted)] hover:text-white text-sm">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[var(--text-secondary)]">
                <div>
                  <strong className="text-[var(--text-primary)]">Mapped Unit:</strong>
                  <p className="mt-1 text-indigo-300 font-semibold">{selectedExp.unit || selectedExp.linkedUnits?.[0]}</p>
                </div>
                <div>
                  <strong className="text-[var(--text-primary)]">Prerequisite & Related Topics:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    {(selectedExp.topics || selectedExp.linkedTopics || []).map((t: string, tIdx: number) => (
                      <li key={tIdx}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-[var(--text-primary)]">Mapped Course Outcome (CO):</strong>
                  <p className="mt-1 text-emerald-400 font-semibold">{selectedExp.co || selectedExp.mappedCOs?.[0]}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
