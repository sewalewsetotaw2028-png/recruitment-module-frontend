import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface MyInterview {
  id: string;
  interview_number: string;
  round: number;
  start_time: string;
  end_time: string;
  status: string;
  mode: string;
  application: {
    id: string;
    vacancy: { id: string; title: string };
    candidate: { first_name: string; last_name: string; email: string };
  };
}

interface InterviewsTodayPanelProps {
  interviews?: MyInterview[];
}

const fullName = (candidate: { first_name: string; last_name: string }) =>
  `${candidate.first_name} ${candidate.last_name}`.trim();

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/**
 * InterviewsTodayPanel shows panel-member interviews with search, filter, and detail view.
 */
export const InterviewsTodayPanel: React.FC<InterviewsTodayPanelProps> = ({
  interviews: interviewsProp = [],
}) => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SCHEDULED' | 'COMPLETED' | 'EVALUATION_PENDING'>('all');
  const [selectedInterview, setSelectedInterview] = useState<MyInterview | null>(null);

  // Defensive normalization — the parent may pass an API response object instead of a plain array
  const interviews: MyInterview[] = Array.isArray(interviewsProp)
    ? interviewsProp
    : Array.isArray((interviewsProp as any)?.data)
      ? (interviewsProp as any).data
      : [];

  const counts = useMemo(() => {
    const completed = interviews.filter((item) =>
      ['COMPLETED', 'EVALUATION_PENDING'].includes(item.status),
    ).length;
    const scheduled = interviews.filter((item) => item.status === 'SCHEDULED').length;
    return { completed, scheduled };
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch = 
        fullName(interview.application.candidate).toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.application.vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interview_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchTerm, statusFilter]);

  if (!interviews.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upcoming Interviews</h3>
            <p className="text-xs text-slate-400 mt-1">
              Interviews assigned to you as a panel member.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-slate-200/60 rounded-md text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            0
          </span>
        </div>
        <div className="p-6 text-sm text-slate-400 italic text-center">
          No interviews assigned yet.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upcoming Interviews</h3>
            <p className="text-xs text-slate-400 mt-1">
              {counts.scheduled} scheduled, {counts.completed} completed.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-slate-200/60 rounded-md text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            {interviews.length}
          </span>
        </div>
        
        {/* Search and Filter */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 space-y-3">
          <input
            type="text"
            placeholder="Search by candidate, vacancy, or interview number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {(['all', 'SCHEDULED', 'COMPLETED', 'EVALUATION_PENDING'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar flex-1">
          {filteredInterviews.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 italic text-center">
              No interviews match your search or filter.
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <div
                key={interview.id}
                onClick={() => setSelectedInterview(interview)}
                className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {fullName(interview.application.candidate)}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {interview.application.vacancy.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      Interview #{interview.interview_number} - Round {interview.round}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                      interview.status === 'SCHEDULED'
                        ? 'bg-blue-50 text-blue-700'
                        : interview.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : interview.status === 'EVALUATION_PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {interview.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    {formatDate(interview.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    {formatTime(interview.start_time)}
                  </span>
                  <span className="capitalize flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">
                      {interview.mode === 'VIRTUAL' ? 'videocam' : interview.mode === 'PHYSICAL' ? 'location_on' : 'meeting_room'}
                    </span>
                    {interview.mode.toLowerCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <button
            type="button"
            onClick={() => navigate('/dashboard/interviews')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInterview && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInterview(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Interview Details</h3>
                <p className="text-sm text-slate-500 mt-1">
                  #{selectedInterview.interview_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Candidate</h4>
                <p className="text-base font-medium text-slate-900">
                  {fullName(selectedInterview.application.candidate)}
                </p>
                <p className="text-sm text-slate-500">{selectedInterview.application.candidate.email}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Position</h4>
                <p className="text-base font-medium text-slate-900">
                  {selectedInterview.application.vacancy.title}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Date & Time</h4>
                  <p className="text-sm text-slate-900">{formatDateTime(selectedInterview.start_time)}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    to {formatTime(selectedInterview.end_time)}
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Round</h4>
                  <p className="text-sm text-slate-900">Round {selectedInterview.round}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Mode</h4>
                <p className="text-sm text-slate-900 capitalize flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    {selectedInterview.mode === 'VIRTUAL' ? 'videocam' : selectedInterview.mode === 'PHYSICAL' ? 'location_on' : 'meeting_room'}
                  </span>
                  {selectedInterview.mode.toLowerCase()}
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Status</h4>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedInterview.status === 'SCHEDULED'
                      ? 'bg-blue-100 text-blue-700'
                      : selectedInterview.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedInterview.status === 'EVALUATION_PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedInterview.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {(['COMPLETED', 'EVALUATION_PENDING'].includes(selectedInterview.status) && can(PERMISSIONS.INTERVIEW_EVALUATE)) && (
              <div className="p-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/interviews/${selectedInterview.id}/evaluate`)}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Submit Evaluation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InterviewsTodayPanel;
