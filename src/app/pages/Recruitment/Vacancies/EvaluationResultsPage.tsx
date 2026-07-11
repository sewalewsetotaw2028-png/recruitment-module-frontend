import React from 'react';
import { useParams } from 'react-router-dom';
import { EvaluationResultsView } from './components/EvaluationResultsView';

export const EvaluationResultsPage: React.FC = () => {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      <EvaluationResultsView vacancyId={vacancyId!} />
    </div>
  );
};

export default EvaluationResultsPage;
