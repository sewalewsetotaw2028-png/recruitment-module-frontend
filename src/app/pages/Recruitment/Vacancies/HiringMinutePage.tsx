import React from 'react';
import { useParams } from 'react-router-dom';
import { HiringMinuteDetailView } from './components/HiringMinuteDetailView';

export const HiringMinutePage: React.FC = () => {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
      <HiringMinuteDetailView hiringMinuteId="" vacancyId={vacancyId!} />
    </div>
  );
};

export default HiringMinutePage;
