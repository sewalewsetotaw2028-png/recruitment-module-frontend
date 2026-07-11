import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EvaluationSubmissionForm } from './components/EvaluationSubmissionForm';

export const EvaluateInterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  return (
    <EvaluationSubmissionForm
      interviewId={interviewId!}
      isOpen={true}
      onClose={() => navigate(-1)}
      onSuccess={() => navigate(-1)}
    />
  );
};

export default EvaluateInterviewPage;
