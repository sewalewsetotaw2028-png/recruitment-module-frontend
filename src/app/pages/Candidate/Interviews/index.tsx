import React, { useEffect, useState, useMemo } from 'react';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { PRIMARY_COLOR_HEX } from '@/config/theme';
import Modal from '@/components/ui/Modal/Modal';

interface PanelMember {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Interview {
  id: string;
  application_id: string;
  interview_round: number;
  interview_type?: string;
  mode?: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  office_location?: string;
  status: string;
  application?: {
    status?: string;
    vacancy?: {
      title: string;
      department?: {
        name: string;
      };
    };
  };
  interview_category?: {
    name: string;
  };
  interview_panels?: PanelMember[];
}

export const CandidateInterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeCall<Interview[]>({
        method: 'GET',
        route: API_ROUTES.candidates.interviews,
        isSecureRoute: true,
      });
      const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
      setInterviews(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Split into upcoming and past interviews
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up: Interview[] = [];
    const ps: Interview[] = [];

    interviews.forEach((i) => {
      const isPast =
        ['COMPLETED', 'CANCELLED', 'FINALIZED'].includes(i.status.toUpperCase()) ||
        (new Date(i.end_time || i.start_time) < now &&
         !['SCHEDULED', 'RESCHEDULED'].includes(i.status.toUpperCase()));
      if (isPast) {
        ps.push(i);
      } else {
        up.push(i);
      }
    });

    // Sort upcoming ascending (soonest first)
    up.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    // Sort past descending (most recent first)
    ps.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    return { upcoming: up, past: ps };
  }, [interviews]);

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'COMPLETED':
      case 'FINALIZED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const renderInterviewCard = (i: Interview) => {
    const scheduledToday = isToday(i.start_time);
    const resolvedMode = (i.mode || i.interview_type || 'virtual').toLowerCase();
    const isVirtual = resolvedMode === 'virtual';

    return (
      <div
        key={i.id}
        onClick={() => setSelectedInterview(i)}
        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-200 hover:border-slate-300 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base tracking-tight">
              {i.application?.vacancy?.title || 'Job Interview'}
            </h3>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              {i.application?.vacancy?.department?.name || 'Department'} • Round {i.interview_round}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scheduledToday && i.status.toUpperCase() !== 'CANCELLED' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide font-mono">
                Today
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[9px] border uppercase tracking-wider font-mono ${getStatusColor(
                i.status,
              )}`}
            >
              {i.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
              Date &amp; Time
            </span>
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-slate-300">calendar_today</span>
              {new Date(i.start_time).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
              Interview Mode
            </span>
            <p className="font-bold text-slate-700 capitalize flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-slate-300">
                {isVirtual ? 'videocam' : 'location_on'}
              </span>
              {resolvedMode}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
              Interview Category
            </span>
            <p className="font-medium text-slate-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-slate-300">assignment</span>
              {i.interview_category?.name || 'General Evaluation'}
            </p>
          </div>
        </div>

        {/* Follow-up action banner for past/completed interviews */}
        {(() => {
          const status = i.status.toUpperCase();
          const appStatus = (i.application?.status || '').toUpperCase();
          const isCompletedLike = ['COMPLETED', 'FINALIZED', 'CANCELLED'].includes(status);
          if (!isCompletedLike) return null;
          if (['OFFER_ISSUED', 'OFFER_ACCEPTED'].includes(appStatus)) {
            return (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">local_offer</span>
                <p className="text-xs text-emerald-800 font-semibold flex-1">You have a pending offer</p>
                <a
                  href="/dashboard/candidate-offers"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                >
                  View offers →
                </a>
              </div>
            );
          }
          if (appStatus === 'REJECTED') {
            return (
              <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">info</span>
                <p className="text-xs text-slate-600 font-medium">Your application was not progressed after this interview.</p>
              </div>
            );
          }
          if (['SELECTED', 'INTERVIEW_COMPLETED', 'UNDER_EVALUATION'].includes(appStatus)) {
            return (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[16px]">hourglass_top</span>
                <p className="text-xs text-amber-800 font-medium">Awaiting final decision.</p>
              </div>
            );
          }
          return null;
        })()}

        {i.status.toUpperCase() !== 'CANCELLED' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-400 font-medium">
              {!isVirtual && i.office_location && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {i.office_location.startsWith('https://www.google.com/maps') ? 'View Location on Map' : `Location: ${i.office_location}`}
                </span>
              )}
            </div>

            {isVirtual && i.meeting_link && (
              <a
                href={i.meeting_link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold !text-white rounded-xl text-center text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                Join Meeting Room
              </a>
            )}

            {!isVirtual && i.office_location && (
              <a
                href={i.office_location.startsWith('https://www.google.com/maps') ? i.office_location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.office_location)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold !text-white rounded-xl text-center text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                View Location
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      <PageSectionHeader
        eyebrow="Candidate Portal"
        title="Interviews"
        description="View your scheduled recruitment rounds, join virtual interview rooms, and check completed evaluations."
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading your interviews…
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PRIMARY_COLOR_HEX }}
              />
              Upcoming Interviews
            </h3>
            {upcoming.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-xs text-slate-400 font-medium">
                No upcoming interviews scheduled.
              </div>
            ) : (
              <div className="space-y-4">{upcoming.map(renderInterviewCard)}</div>
            )}
          </div>

          {/* Past Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 tracking-tight flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Past &amp; Completed Interviews
            </h3>
            {past.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-xs text-slate-400 font-medium">
                No past interviews recorded.
              </div>
            ) : (
              <div className="space-y-4">{past.map(renderInterviewCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* Interview Details Modal */}
      <Modal
        isOpen={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        title="Interview Details"
        size="lg"
      >
        {selectedInterview && (
          <div className="space-y-6 text-slate-700 text-xs">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedInterview.application?.vacancy?.title || 'Job Interview'}
              </h3>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                {selectedInterview.application?.vacancy?.department?.name || 'Department'} • Round {selectedInterview.interview_round}
              </p>
            </div>

            {/* Grid schedule info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                  Date &amp; Time
                </span>
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-slate-300">calendar_today</span>
                  {new Date(selectedInterview.start_time).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                  Interview Mode
                </span>
                <p className="font-bold text-slate-700 capitalize flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-slate-300">
                    {(selectedInterview.mode || selectedInterview.interview_type || 'virtual').toLowerCase() === 'virtual' ? 'videocam' : 'location_on'}
                  </span>
                  {selectedInterview.mode || selectedInterview.interview_type || 'virtual'}
                </p>
              </div>
            </div>

            {/* Meeting Link / Office Location */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              {(selectedInterview.mode || selectedInterview.interview_type || 'virtual').toLowerCase() === 'virtual' ? (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Virtual Meeting details</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">Link becomes active at the scheduled start time</p>
                  </div>
                  {selectedInterview.meeting_link ? (
                    <a
                      href={selectedInterview.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold !text-white rounded-xl text-center text-xs transition-colors shadow-sm flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">videocam</span>
                      Launch Room
                    </a>
                  ) : (
                    <span className="text-slate-400 font-medium">Link not assigned yet</span>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Office / Physical Location</h4>
                  {(() => {
                    const location = selectedInterview.office_location;
                    const isEmbedUrl = location?.includes('/maps/embed');
                    return isEmbedUrl ? (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                        <iframe
                          src={location}
                          width="100%"
                          height="250"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-slate-600 font-medium mb-2">
                          {location || 'Company Head Office'}
                        </p>
                        {location && (
                          <a
                            href={location}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">map</span>
                            View on Google Maps
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Category / Type info */}
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Interview Round Category</h4>
              <p className="text-slate-600 font-medium bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                {selectedInterview.interview_category?.name || 'General Evaluation'}
              </p>
            </div>

            {/* Panel Members List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Interview Panel Members</h4>
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl divide-y divide-slate-200/50">
                {selectedInterview.interview_panels && selectedInterview.interview_panels.length > 0 ? (
                  selectedInterview.interview_panels.map((panel, idx) => (
                    <div key={panel.id || idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                      <span className="font-semibold text-slate-800">
                        {panel.user.first_name} {panel.user.last_name}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{panel.user.email}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 py-2 font-medium text-center">No panel members assigned to this round yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CandidateInterviewsPage;
