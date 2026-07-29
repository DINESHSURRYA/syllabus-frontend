import React from 'react';
import { SyllabusCard } from './SyllabusCard';
import { CardLoader } from '@/components/loaders/CardLoader';
import { EmptyState } from '@/components/errors/EmptyState';

interface SyllabusGridProps {
  loading: boolean;
  syllabi: any[];
  onOpenCoPo: (syllabus: any, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SyllabusGrid({ loading, syllabi, onOpenCoPo, onDelete }: SyllabusGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    );
  }

  if (!syllabi || syllabi.length === 0) {
    return <EmptyState title="No Syllabi Found" description="Try adjusting your search query or uploading a new syllabus." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {syllabi.map((item) => (
        <SyllabusCard key={item.id || item._id || item.courseCode} syllabus={item} onOpenCoPo={onOpenCoPo} onDelete={onDelete} />
      ))}
    </div>
  );
}
