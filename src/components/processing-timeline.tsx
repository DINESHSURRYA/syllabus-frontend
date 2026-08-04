"use client";
import './styles/processing-timeline.css';
import { useSyllabusStore } from '@/stores';
import { Phase1ExtractionProgress } from '@/components/syllabus/phase1-extraction-progress';

interface ProcessingTimelineProps {
  progress: number;
  currentStageIndex: number;
  status: 'idle' | 'connecting' | 'processing' | 'error' | 'timeout' | 'completed';
  errorMessage?: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ProcessingTimeline({
  progress,
  currentStageIndex,
  status,
  errorMessage,
  onRetry,
  onCancel,
}: ProcessingTimelineProps) {
  const fileName = useSyllabusStore((state) => state.fileName) || 'BE3251.pdf';

  // Calculate 1 to 7 step number based on percentage
  let calculatedStep = 1;
  if (status === 'completed' || progress >= 100) {
    calculatedStep = 7;
  } else if (progress >= 85) {
    calculatedStep = 6;
  } else if (progress >= 70) {
    calculatedStep = 5;
  } else if (progress >= 55) {
    calculatedStep = 4;
  } else if (progress >= 35) {
    calculatedStep = 3;
  } else if (progress >= 15) {
    calculatedStep = 2;
  } else {
    calculatedStep = 1;
  }

  return (
    <Phase1ExtractionProgress
      fileName={fileName}
      currentStep={calculatedStep}
      progress={progress}
      error={status === 'error' ? errorMessage || 'Unable to connect to processing server' : null}
      onRetry={onRetry}
      onCancel={onCancel}
    />
  );
}

