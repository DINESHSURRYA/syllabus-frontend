"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import FileDropzone from '@/components/ui/evaluator/FileDropzone';
import ProgressThread from '@/components/ui/evaluator/ProgressThread';
import { useEvaluatorStore, CandidateInfo, AssessmentInfo } from '@/stores/evaluator.store';
import { evaluatorApi } from '@/lib/api/evaluator.api';
import { cn } from '@/lib/utils';
import { User, UploadCloud, CheckCircle2, GraduationCap, BookOpen } from 'lucide-react';

const mockCandidatesList: CandidateInfo[] = [
  {
    candidate_id: 'CAND-2026-001',
    candidate_code: 'ALEX_MERCER',
    candidate_name: 'Alex Mercer',
    candidate_email: 'alex.mercer@university.edu',
    department: 'Computer Science & Engineering',
    course_batch: 'CS-2026-A',
  },
  {
    candidate_id: 'CAND-2026-002',
    candidate_code: 'SARAH_CONNOR',
    candidate_name: 'Sarah Connor',
    candidate_email: 'sarah.connor@institution.ac.in',
    department: 'Information Technology',
    course_batch: 'IT-2026-B',
  },
  {
    candidate_id: 'CAND-2026-003',
    candidate_code: 'JORDAN_LEE',
    candidate_name: 'Jordan Lee',
    candidate_email: 'jordan.lee@tech.edu',
    department: 'Artificial Intelligence & DS',
    course_batch: 'AIDS-2026-A',
  },
];

const mockAssessmentsList: AssessmentInfo[] = [
  {
    attempt_id: 'ATT-2026-101',
    assessment_id: 'ASM-DS-01',
    course_code: 'CS101',
    assessment_name: 'Data Structures & Algorithms Midterm',
    percentage: 78.5,
    grade: 'B+',
    weak_areas: ['Binary Search Trees', 'Graph Traversal', 'Dynamic Programming'],
    strong_areas: ['Arrays & Hash Maps', 'Linked Lists'],
    questions: [
      {
        question: 'What is the worst-case time complexity of search in an unbalanced Binary Search Tree?',
        topic: 'Binary Search Trees',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        user_answer: 'O(log n)',
        correct_answer: 'O(n)',
        is_correct: false,
        bloom_level: 'K2',
      },
    ],
  },
];

export default function UploadScreenPage() {
  const router = useRouter();
  const {
    selectedCandidate,
    setSelectedCandidate,
    selectedAssessment,
    setSelectedAssessment,
    uploadedFile,
    isStarting,
    error,
    generateAndStartInterview,
  } = useEvaluatorStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'selection'>('upload');
  const [candidatePresets, setCandidatePresets] = useState<any[]>(mockCandidatesList);
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentInfo[]>(mockAssessmentsList);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPresets() {
      try {
        const res = await evaluatorApi.getCandidatePresets();
        const candidates = res.candidates || (Array.isArray(res) ? res : []);
        if (Array.isArray(candidates) && candidates.length > 0) {
          setCandidatePresets(candidates);
          const firstCand = candidates[0];
          setSelectedCandidate(firstCand);
          if (firstCand.assessments && firstCand.assessments.length > 0) {
            setAvailableAssessments(firstCand.assessments);
            setSelectedAssessment(firstCand.assessments[0]);
          }
        }
      } catch (err) {
        console.log('Using default preset list:', err);
      }
    }
    loadPresets();
  }, []);

  const handleSelectCandidate = (cand: any) => {
    setSelectedCandidate(cand);
    const tests = cand.assessments || mockAssessmentsList;
    setAvailableAssessments(tests);
    if (tests.length > 0) {
      setSelectedAssessment(tests[0]);
    }
  };

  const handleStart = async () => {
    try {
      setLocalError(null);
      await generateAndStartInterview();
      router.push('/evaluator/interview');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to start interview');
    }
  };

  const isButtonDisabled =
    isStarting ||
    (activeTab === 'upload' && !uploadedFile) ||
    (activeTab === 'selection' && (!selectedCandidate || !selectedAssessment));

  return (
    <AppShell>
      <div className="min-h-screen relative flex bg-background text-surface">
        <ProgressThread />
        <main className="flex-1 ml-1 pl-4 sm:pl-8 flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full min-h-screen">
            <div className="w-full max-w-[640px] flex flex-col items-center text-center my-8">
              <span className="font-mono text-accent text-sm tracking-widest uppercase mb-3">
                Step 01 — MCQ Ingestion
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl text-surface mb-3">
                Drop in your assessment.
              </h1>
              <p className="text-muted mb-8 text-lg max-w-[500px]">
                Upload your completed MCQ assessment JSON file or select candidate presets to begin the evidence-driven interview evaluation.
              </p>

              {/* Mode Switcher */}
              <div className="flex bg-surface/10 rounded-full p-1 mb-8 border border-surface/10">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                    activeTab === 'upload' ? "bg-surface text-background shadow-md" : "text-surface/70 hover:text-surface"
                  )}
                >
                  <UploadCloud className="w-4 h-4" />
                  JSON Upload
                </button>
                <button
                  onClick={() => setActiveTab('selection')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                    activeTab === 'selection' ? "bg-surface text-background shadow-md" : "text-surface/70 hover:text-surface"
                  )}
                >
                  <User className="w-4 h-4" />
                  Candidate Presets
                </button>
              </div>

              {activeTab === 'upload' && (
                <FileDropzone 
                  onUploadSuccess={() => setLocalError(null)} 
                  onError={(msg) => setLocalError(msg)} 
                />
              )}

              {activeTab === 'selection' && (
                <div className="w-full max-w-xl text-left space-y-4">
                  <div className="bg-surface/5 border border-surface/10 rounded-2xl p-4">
                    <h3 className="font-serif text-lg mb-3 flex items-center gap-2 text-surface">
                      <GraduationCap className="w-5 h-5 text-accent" /> Select Candidate
                    </h3>
                    <div className="space-y-2">
                      {candidatePresets.map((cand) => {
                        const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
                        return (
                          <div
                            key={cand.candidate_id}
                            onClick={() => handleSelectCandidate(cand)}
                            className={cn(
                              "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                              isSelected ? "bg-accent/10 border-accent text-surface" : "bg-surface/5 border-surface/10 text-surface/70 hover:bg-surface/10"
                            )}
                          >
                            <div>
                              <p className="font-medium text-sm">{cand.candidate_name}</p>
                              <p className="text-xs text-muted font-mono">{cand.candidate_email}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-success" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-surface/5 border border-surface/10 rounded-2xl p-4">
                    <h3 className="font-serif text-lg mb-3 flex items-center gap-2 text-surface">
                      <BookOpen className="w-5 h-5 text-accent" /> Select Assessment Test
                    </h3>
                    <div className="space-y-2">
                      {availableAssessments.map((asm) => {
                        const isSelected = selectedAssessment?.attempt_id === asm.attempt_id;
                        return (
                          <div
                            key={asm.attempt_id}
                            onClick={() => setSelectedAssessment(asm)}
                            className={cn(
                              "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                              isSelected ? "bg-accent/10 border-accent text-surface" : "bg-surface/5 border-surface/10 text-surface/70 hover:bg-surface/10"
                            )}
                          >
                            <div>
                              <p className="font-medium text-sm">{asm.assessment_name}</p>
                              <p className="text-xs text-muted font-mono">{asm.course_code} • Score: {asm.percentage}% ({asm.grade || 'PASS'})</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-success" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(error || localError) && (
                <p className="text-error mt-4 text-sm font-medium">
                  {error || localError}
                </p>
              )}

              <button
                onClick={handleStart}
                disabled={isButtonDisabled}
                className={cn(
                  "mt-8 px-8 py-3 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background cursor-pointer",
                  !isButtonDisabled
                    ? "bg-accent text-background hover:bg-accent/90 shadow-lg transform hover:-translate-y-0.5" 
                    : "bg-surface/20 text-surface/40 cursor-not-allowed opacity-40"
                )}
              >
                {isStarting ? "Starting..." : "Start Interview"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
