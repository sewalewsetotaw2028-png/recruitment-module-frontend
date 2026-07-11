import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

interface StageHistory {
  id: string;
  to_stage: string;
  changed_at: string;
  notes?: string;
}

interface ApplicationDetail {
  id: string;
  status: string;
  current_stage: string;
  submitted_at: string;
  rejection_reason?: string | null;
  vacancy: {
    id?: string;
    title: string;
    location?: string;
    employment_type?: string;
    description: string;
    responsibilities?: string;
    requirements?: string;
    department?: {
      name: string;
    };
  };
  stage_histories: StageHistory[];
}

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const res = await makeCall<any>({
          method: 'GET',
          route: `${API_ROUTES.candidates.applications}/${id}`,
          isSecureRoute: true,
        });

        // makeCall returns { data: { status, data: applicationObject } } — unpack both levels
        const app = res?.data?.data ?? res?.data ?? res;
        if (!app || typeof app !== 'object') {
          throw new Error('Application details not found or malformed payload');
        }

        // Ensure array safety for list mapping elements
        if (!app.stage_histories) {
          app.stage_histories = [];
        }

        setDetail(app);
      } catch (err: any) {
        console.error('Application fetch failed:', err);
        setError(err?.message || 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    if (!status) return 'bg-blue-50 text-blue-700 border-blue-200';
    switch (status.toLowerCase()) {
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'offer_accepted':
      case 'hired':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const formatEmploymentType = (type?: string) => {
    if (!type) return 'Not Specified';
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm text-sm font-semibold text-slate-500">
          Loading application detail…
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen space-y-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/applications')}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">
            arrow_back
          </span>
          Back to Applications
        </button>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {error || 'Application not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard/applications')}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">
            arrow_back
          </span>
          Back to Applications
        </button>
      </div>

      {/* Main Vacancy Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {detail.vacancy?.title || 'Unknown Position'}
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {detail.vacancy?.department?.name || 'Department'} •{' '}
              {detail.vacancy?.location || 'Location'} •{' '}
              {formatEmploymentType(detail.vacancy?.employment_type)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide border font-mono ${getStatusBadge(
                detail.status,
              )}`}
            >
              {(detail.status || 'UNKNOWN').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Recruitment Progress Timeline */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Application Progress Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological record of stage movements
          </p>
        </div>

        {detail.stage_histories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No progress records yet
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {detail.stage_histories.map((stage, idx) => {
              const isLast = idx === detail.stage_histories.length - 1;
              return (
                <div key={stage.id || idx} className="relative space-y-1">
                  <span
                    className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2"
                    style={{
                      backgroundColor: isLast
                        ? PRIMARY_COLOR_HEX
                        : 'rgb(226, 232, 240)',
                      boxShadow: isLast
                        ? `0 0 0 2px ${PRIMARY_COLOR_HEX}4D`
                        : 'none',
                    }}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-slate-800 text-xs md:text-sm">
                      Stage: {(stage.to_stage || 'UNKNOWN').toUpperCase()}
                    </p>
                    {stage.changed_at && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(stage.changed_at).toLocaleDateString(
                          undefined,
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          },
                        )}
                      </span>
                    )}
                  </div>
                  {stage.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed pl-1">
                      {stage.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vacancy Details Accordion / Segment */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Vacancy Details
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Job requirements and description for reference
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          {detail.vacancy?.description ? (
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Description</h4>
              <p>{detail.vacancy.description}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No job description provided.
            </p>
          )}
          {detail.vacancy?.responsibilities && (
            <div>
              <h4 className="font-bold text-slate-800 mb-1">
                Responsibilities
              </h4>
              <p>{detail.vacancy.responsibilities}</p>
            </div>
          )}
          {detail.vacancy?.requirements && (
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Requirements</h4>
              <p>{detail.vacancy.requirements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
