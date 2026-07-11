// @ts-nocheck

import React, { useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/hooks';

import { PageSectionHeader } from '@/components/common/PageSectionHeader';

import {

  useCandidateApplicationsSlice,

  candidateApplicationsActions,

} from './slice';

import makeCall from '@/API';

import { API_ROUTES } from '@/API/apiRoutes';

import Modal from '@/components/ui/Modal/Modal';

import { PRIMARY_COLOR_HEX, THEME_COLORS, TYPOGRAPHY } from '@/config/theme';

import { Button } from '@/components/common/Button';

import { Card } from '@/components/common/Card';

import { Badge } from '@/components/common/Badge';

import {

  selectCandidateApplications,

  selectCandidateApplicationsError,

  selectCandidateApplicationsInterviews,

  selectCandidateApplicationsLoading,

} from './slice/selectors';



export const CandidateApplicationsPage: React.FC = () => {

  useCandidateApplicationsSlice();


  const dispatch = useAppDispatch();


  const applications = useAppSelector(selectCandidateApplications);

  const interviews = useAppSelector(selectCandidateApplicationsInterviews);

  const loading = useAppSelector(selectCandidateApplicationsLoading);

  const error = useAppSelector(selectCandidateApplicationsError);



  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const [detail, setDetail] = useState<any | null>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const [recruitmentSources, setRecruitmentSources] = useState<Array<{id: string, name: string}>>([]);



  useEffect(() => {


    dispatch(candidateApplicationsActions.fetchApplicationsRequest());

  }, [dispatch]);




  useEffect(() => {
    // Fetch recruitment sources
    const fetchRecruitmentSources = async () => {
      try {
        const res = await makeCall({
          method: 'GET',
          route: API_ROUTES.candidates.recruitmentSources,
          isSecureRoute: true,
        }) as any;
        const sources = res?.data?.data ?? res?.data ?? [];
        setRecruitmentSources(Array.isArray(sources) ? sources : []);
      } catch (err) {
        console.error('Failed to fetch recruitment sources:', err);
      }
    };
    fetchRecruitmentSources();
  }, []);



  useEffect(() => {

    if (!selectedAppId) {

      setDetail(null);

      return;

    }

    const fetchDetail = async () => {

      try {

        setLoadingDetail(true);

        setErrorDetail(null);

        const res = await makeCall<any>({

          method: 'GET',

          route: `${API_ROUTES.candidates.applications}/${selectedAppId}`,

          isSecureRoute: true,

        });

        // makeCall returns { data: { status, data: applicationObject } } — unpack both levels
        const app = res?.data?.data ?? res?.data ?? res;
        if (!app) throw new Error('Application details not found');

        setDetail(app);

      } catch (err: any) {

        setErrorDetail(err?.message || 'Failed to load application details');

      } finally {

        setLoadingDetail(false);

      }

    };

    fetchDetail();

  }, [selectedAppId]);



  const getStatusVariant = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {

    switch (status.toLowerCase()) {

      case 'interview':

        return 'warning';

      case 'offered':

        return 'info';

      case 'hired':

        return 'success';

      case 'rejected':

        return 'error';

      default:

        return 'primary';

    }

  };



  const applicationsWithInterviews = useMemo(

    () =>

      applications.map((app) => ({

        ...app,

        interviews: interviews.filter((i) => i.applicationId === app.id),

      })),

    [applications, interviews],

  );



  return (

    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased animate-fadeIn">

      <PageSectionHeader

        eyebrow="Candidate portal"

        title="My Applications"

        description="Monitor your recruiting pipeline, track interview invitations, and view your application statuses."

      />



      {error ? (

        <Card padding="md" style={{ borderColor: THEME_COLORS.errorLight, backgroundColor: THEME_COLORS.errorLight }}>

          <p style={{ color: THEME_COLORS.errorDark, fontWeight: TYPOGRAPHY.fontWeight.medium, margin: 0 }}>

            {error}

          </p>

        </Card>

      ) : null}



      {loading ? (

        <Card padding="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>

          <div style={{ textAlign: 'center' }}>

            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />

            <p

              style={{

                color: THEME_COLORS.textSecondary,

                fontSize: TYPOGRAPHY.fontSize.base,

                fontWeight: TYPOGRAPHY.fontWeight.medium,

                margin: 0,

              }}

            >

              Loading your applications…

            </p>

          </div>

        </Card>

      ) : (

        <div className="space-y-4">

          {applicationsWithInterviews.map((app) => {

            return (

              <Card

                key={app.id}

                padding="lg"

                hover

                clickable

                onClick={() => setSelectedAppId(app.id)}

              >

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                  <div className="md:col-span-6 min-w-0">

                    <div className="flex items-start gap-3">

                      <div 

                        style={{

                          display: 'flex',

                          height: '36px',

                          width: '36px',

                          alignItems: 'center',

                          justifyContent: 'center',

                          borderRadius: '12px',

                          backgroundColor: THEME_COLORS.slate50,

                          color: THEME_COLORS.textTertiary,

                          border: `1px solid ${THEME_COLORS.borderLight}`,

                          flexShrink: 0,

                        }}

                      >

                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>

                          account_balance

                        </span>

                      </div>

                      <div className="min-w-0">

                        <h3 

                          style={{

                            fontSize: TYPOGRAPHY.fontSize.base,

                            fontWeight: TYPOGRAPHY.fontWeight.bold,

                            color: THEME_COLORS.textPrimary,

                            margin: 0,

                            overflow: 'hidden',

                            textOverflow: 'ellipsis',

                            whiteSpace: 'nowrap',

                          }}

                        >

                          {app.vacancyTitle}

                        </h3>

                        <p 

                          style={{

                            fontSize: TYPOGRAPHY.fontSize.xs,

                            fontWeight: TYPOGRAPHY.fontWeight.medium,

                            color: THEME_COLORS.textTertiary,

                            marginTop: '2px',

                            margin: '2px 0 0 0',

                            overflow: 'hidden',

                            textOverflow: 'ellipsis',

                            whiteSpace: 'nowrap',

                          }}

                        >

                          {app.location ?? 'Remote / Hybrid'}

                        </p>

                      </div>

                    </div>

                  </div>



                  <div className="md:col-span-3 flex flex-col gap-1 pl-12 md:pl-0">

                    <span 

                      style={{

                        fontSize: TYPOGRAPHY.fontSize.xs,

                        fontWeight: TYPOGRAPHY.fontWeight.bold,

                        textTransform: 'uppercase',

                        letterSpacing: TYPOGRAPHY.letterSpacing.wider,

                        color: THEME_COLORS.textTertiary,

                        fontFamily: TYPOGRAPHY.fontFamily.mono,

                      }}

                    >

                      Recruitment Stage

                    </span>

                    <p 

                      style={{

                        fontSize: TYPOGRAPHY.fontSize.sm,

                        fontWeight: TYPOGRAPHY.fontWeight.bold,

                        color: THEME_COLORS.textSecondary,

                        margin: 0,

                      }}

                    >

                      {app.currentStage}

                    </p>

                  </div>



                  <div className="md:col-span-3 flex flex-col gap-1 pl-12 md:pl-0">

                    <span 

                      style={{

                        fontSize: TYPOGRAPHY.fontSize.xs,

                        fontWeight: TYPOGRAPHY.fontWeight.bold,

                        textTransform: 'uppercase',

                        letterSpacing: TYPOGRAPHY.letterSpacing.wider,

                        color: THEME_COLORS.textTertiary,

                        fontFamily: TYPOGRAPHY.fontFamily.mono,

                      }}

                    >

                      Status Indicator

                    </span>

                    <div>

                      <Badge variant={getStatusVariant(app.applicationStatus)} size="sm">

                        {app.applicationStatus.toUpperCase()}

                      </Badge>

                    </div>

                  </div>

                </div>



                {app.interviews.length > 0 && (

                  <div 

                    className="space-y-3"

                    style={{ borderTop: `1px solid ${THEME_COLORS.borderLight}`, paddingTop: '16px', marginTop: '16px', paddingLeft: '48px' }}

                  >

                    <div className="flex items-center gap-1.5" style={{ color: THEME_COLORS.textPrimary }}>

                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: THEME_COLORS.info }}>

                        event_repeat

                      </span>

                      <h4 

                        style={{

                          fontSize: TYPOGRAPHY.fontSize.xs,

                          fontWeight: TYPOGRAPHY.fontWeight.bold,

                          margin: 0,

                        }}

                      >

                        Interview Timeline &amp; Logs

                      </h4>

                    </div>



                    <div className="space-y-2">

                      {app.interviews.map((int) => (

                        <Card

                          key={int.id}

                          padding="md"

                          hover={false}

                          style={{ 

                            backgroundColor: THEME_COLORS.slate50,

                            borderColor: THEME_COLORS.borderLight,

                          }}

                        >

                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">

                            <div className="space-y-0.5">

                              <p 

                                style={{

                                  fontSize: TYPOGRAPHY.fontSize.xs,

                                  fontWeight: TYPOGRAPHY.fontWeight.bold,

                                  color: THEME_COLORS.textPrimary,

                                  margin: 0,

                                }}

                              >

                                Round {int.interviewRound} —{' '}

                                <span style={{ color: THEME_COLORS.info, fontWeight: TYPOGRAPHY.fontWeight.bold }}>

                                  {int.interviewType.toUpperCase()}

                                </span>

                              </p>

                              <p 

                                style={{

                                  fontSize: TYPOGRAPHY.fontSize.xs,

                                  fontWeight: TYPOGRAPHY.fontWeight.medium,

                                  color: THEME_COLORS.textTertiary,

                                  display: 'flex',

                                  alignItems: 'center',

                                  gap: '4px',

                                  margin: 0,

                                }}

                              >

                                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: THEME_COLORS.border }}>

                                  schedule

                                </span>

                                Scheduled:{' '}

                                {new Date(int.scheduledStart).toLocaleString(

                                  undefined,

                                  { dateStyle: 'medium', timeStyle: 'short' },

                                )}

                              </p>

                            </div>



                            {int.meetingLink &&

                              int.interviewStatus?.toLowerCase() === 'scheduled' && (

                                <Button

                                  size="sm"

                                  onClick={() => window.open(int.meetingLink, '_blank')}

                                  leftIcon={<span className="material-symbols-outlined" style={{ fontSize: '15px' }}>videocam</span>}

                                >

                                  Launch Room

                                </Button>

                              )}

                          </div>

                        </Card>

                      ))}

                    </div>

                  </div>

                )}

              </Card>

            );

          })}



          {applicationsWithInterviews.length === 0 && (

            <Card 

              padding="lg" 

              style={{ 

                textAlign: 'center',

                borderStyle: 'dashed',

                maxWidth: '512px',

                margin: '24px auto',

              }}

            >

              <div 

                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  height: '44px',

                  width: '44px',

                  borderRadius: '50%',

                  backgroundColor: THEME_COLORS.slate50,

                  color: THEME_COLORS.textTertiary,

                  border: `1px solid ${THEME_COLORS.borderLight}`,

                }}

              >

                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>

                  layers_clear

                </span>

              </div>

              <div className="space-y-1" style={{ marginTop: '12px' }}>

                <p 

                  style={{

                    fontSize: TYPOGRAPHY.fontSize.sm,

                    fontWeight: TYPOGRAPHY.fontWeight.bold,

                    color: THEME_COLORS.textPrimary,

                    margin: 0,

                  }}

                >

                  No pipeline applications submitted

                </p>

                <p 

                  style={{

                    fontSize: TYPOGRAPHY.fontSize.xs,

                    color: THEME_COLORS.textTertiary,

                    maxWidth: '256px',

                    margin: '0 auto',

                    lineHeight: TYPOGRAPHY.lineHeight.relaxed,

                  }}

                >

                  You have not initiated any candidate screening sequences yet.

                  Open your central Careers Board to find available targets.

                </p>

              </div>

            </Card>

          )}

        </div>

      )}



      <Modal

        isOpen={!!selectedAppId}

        onClose={() => setSelectedAppId(null)}

        title="Application Details"

        size="xl"

      >

        {loadingDetail ? (

          <div className="text-center py-8 text-slate-500 text-sm font-semibold">

            Loading details...

          </div>

        ) : errorDetail ? (

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-sm font-medium">

            {errorDetail}

          </div>

        ) : detail ? (

          <div className="space-y-6 text-slate-700 text-xs">

            {/* Header info */}

            <div className="border-b border-slate-100 pb-4">

              <h3 className="text-lg font-bold text-slate-900">{detail.vacancy?.title}</h3>

              <p className="text-slate-400 text-xs font-medium mt-0.5">

                {detail.vacancy?.department?.name || 'Department'} • {detail.vacancy?.location || 'Remote / Hybrid'} • {detail.vacancy?.employment_type}

              </p>

            </div>



            {/* Application Data */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <h4 className="font-bold text-slate-900 mb-1">Application Info</h4>

                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2">

                  <div className="flex justify-between">

                    <span className="text-slate-400 font-medium">Applied Date</span>

                    <span className="font-semibold text-slate-800">

                      {detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString() : 'N/A'}

                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-slate-400 font-medium">Current Status</span>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide border font-mono bg-blue-50 text-blue-700 border-blue-200/60 uppercase">

                      {detail.status}

                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-slate-400 font-medium">Expected Salary</span>

                    <span className="font-semibold text-slate-800">

                      {detail.expected_salary ? `ETB ${Number(detail.expected_salary).toLocaleString()}` : 'Not Specified'}

                    </span>

                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Recruitment Source</span>
                    <span className="font-semibold text-slate-800">
                      {detail.recruitment_source_id 
                        ? recruitmentSources.find(s => s.id === detail.recruitment_source_id)?.name || 'Unknown'
                        : 'Not Specified'
                      }
                    </span>
                  </div>

                  {(detail.cover_letter_url || detail.cover_letter_text) && (
                    <div className="pt-1 border-t border-slate-200/50 mt-1">
                      <span className="text-slate-400 font-medium block mb-2">Cover Letter</span>
                      {detail.cover_letter_url ? (
                        <a
                          href={detail.cover_letter_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          Download file
                        </a>
                      ) : (
                        <div className="bg-slate-100 p-3 rounded-lg text-slate-700 text-xs leading-relaxed max-h-[120px] overflow-y-auto">
                          {detail.cover_letter_text}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>



              {/* Progress timeline */}

              <div>

                <h4 className="font-bold text-slate-900 mb-1">Status Progress Timeline</h4>

                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl max-h-[160px] overflow-y-auto relative pl-6 space-y-4 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200">

                  {detail.stage_histories?.map((stage: any, idx: number) => {

                    const isLast = idx === detail.stage_histories.length - 1;

                    return (

                      <div key={stage.id} className="relative">

                        <span

                          className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border border-white ring-2"

                          style={{

                            backgroundColor: isLast ? PRIMARY_COLOR_HEX : 'rgb(203, 213, 225)',

                            boxShadow: isLast ? `0 0 0 2px ${PRIMARY_COLOR_HEX}4D` : 'none',

                          }}

                        />

                        <div className="flex justify-between items-start gap-2">

                          <p className="font-bold text-slate-700 text-xs uppercase font-mono">

                            {stage.to_stage.replace(/_/g, ' ')}

                          </p>

                          <span className="text-[10px] text-slate-400 font-mono">

                            {new Date(stage.changed_at).toLocaleString(
                              undefined,
                              { dateStyle: 'medium', timeStyle: 'short' },
                            )}

                          </span>

                        </div>

                        {stage.notes && (

                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">

                            {stage.notes}

                          </p>

                        )}

                      </div>

                    );

                  })}

                  {(!detail.stage_histories || detail.stage_histories.length === 0) && (

                    <p className="text-slate-400 text-center py-4 font-medium">No progress records yet</p>

                  )}

                </div>

              </div>

            </div>



            {/* Vacancy Details */}

            <div className="space-y-4 pt-2 border-t border-slate-100">

              <h4 className="font-bold text-slate-900">Job Description</h4>

              <div className="space-y-3.5 bg-slate-50/50 border border-slate-100/80 p-4 rounded-xl text-slate-600 leading-relaxed max-h-[220px] overflow-y-auto">

                {detail.vacancy?.description && (

                  <div>

                    <h5 className="font-bold text-slate-800 mb-0.5">Role Summary</h5>

                    <p>{detail.vacancy.description}</p>

                  </div>

                )}

                {detail.vacancy?.responsibilities && (

                  <div>

                    <h5 className="font-bold text-slate-800 mb-0.5">Responsibilities</h5>

                    <p>{detail.vacancy.responsibilities}</p>

                  </div>

                )}

                {detail.vacancy?.requirements && (

                  <div>

                    <h5 className="font-bold text-slate-800 mb-0.5">Requirements &amp; Experience</h5>

                    <p>{detail.vacancy.requirements}</p>

                  </div>

                )}

                {detail.vacancy?.required_qualifications && (

                  <div>

                    <h5 className="font-bold text-slate-800 mb-0.5">Qualifications</h5>

                    <p>{detail.vacancy.required_qualifications}</p>

                  </div>

                )}

              </div>

            </div>

          </div>

        ) : null}

      </Modal>

    </div>

  );

};



export default CandidateApplicationsPage;

