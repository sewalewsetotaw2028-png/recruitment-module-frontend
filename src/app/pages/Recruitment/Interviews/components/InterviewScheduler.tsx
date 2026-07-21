import React, { useState, useEffect } from 'react';

import { useToast } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { fetchEvaluationTemplates } from '@/hooks/useEvaluationTemplates';
import type { EvaluationTemplate } from '@/hooks/useEvaluationTemplates';



interface InterviewSchedulerProps {

  vacancies: any[];

  applications: any[];

  interviews: any[];

  users: any[];

  questionBank: any[];

  interviewCategories: any[];

  scheduleInterview: (

    appId: string,

    type: 'physical' | 'virtual' | 'hybrid',

    start: string,

    end: string,

    location: string,

    panelIds: string[],

    questions: string[],

    meetingLink?: string,

    hybridConfig?: any,

    categoryId?: string,

  ) => void;

  preselectedAppId?: string;

}



export const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({

  vacancies,

  applications,

  interviews,

  users,

  questionBank,

  interviewCategories,

  scheduleInterview,

  preselectedAppId,

}) => {

  const { toast } = useToast();
  const { can } = usePermissions();



  const [schedAppId, setSchedAppId] = useState('');

  const [interviewVacancyId, setInterviewVacancyId] = useState('all');

  // Auto-fill vacancy and candidate when preselectedAppId is provided
  useEffect(() => {
    if (preselectedAppId) {
      const preselectedApp = applications.find(app => app.id === preselectedAppId);
      if (preselectedApp) {
        setSchedAppId(preselectedAppId);
        setInterviewVacancyId(preselectedApp.vacancyId);
      }
    }
  }, [preselectedAppId, applications]);

  const [intType, setIntType] = useState<'physical' | 'virtual' | 'hybrid'>(

    'virtual',

  );

  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [schedTime, setSchedTime] = useState('10:00');

  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [meetingLink, setMeetingLink] = useState('');

  const [location, setLocation] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const pageSize = 10;

  const [segments, setSegments] = useState<

    {

      segmentType: 'physical' | 'virtual';

      date: string;

      startTime: string;

      endTime: string;

      location: string;

      meetingLink?: string;

    }[]

  >([]);

  const [newSegmentType, setNewSegmentType] = useState<'physical' | 'virtual'>(

    'virtual',

  );

  const [newSegmentDate, setNewSegmentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [newSegmentStartTime, setNewSegmentStartTime] = useState('10:00');

  const [newSegmentEndTime, setNewSegmentEndTime] = useState('11:00');

  const [newSegmentLocation, setNewSegmentLocation] = useState('');

  const [newSegmentMeetingLink, setNewSegmentMeetingLink] = useState('');

  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [evaluationTemplates, setEvaluationTemplates] = useState<EvaluationTemplate[]>([]);

  useEffect(() => {
    const loadEvaluationTemplates = async () => {
      try {
        const templates = await fetchEvaluationTemplates();
        setEvaluationTemplates(templates);
      } catch (error) {
        console.error('Failed to load evaluation templates:', error);
      }
    };
    void loadEvaluationTemplates();
  }, []);

  const handleGenerateMeetingLink = () => {
    if (scheduledApp) {
      // Generate a Google Meet-style link with random letters
      const generateRandomString = (length: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      const meetCode = `${generateRandomString(3)}-${generateRandomString(4)}-${generateRandomString(3)}`;
      const generatedLink = `https://meet.google.com/${meetCode}`;
      setMeetingLink(generatedLink);
    }
  };


  const scheduledApp = applications.find((a) => a.id === schedAppId);



  // Only show candidates in stages where scheduling makes sense —
  // prevents accidentally scheduling for rejected or not-yet-screened candidates.
  const SCHEDULABLE_STATUSES = ['shortlisted', 'interview_scheduled', 'under_evaluation', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'UNDER_EVALUATION'];

  const filteredInterviewableApplications = applications
    .filter((a) => {
      const matchesVacancy = interviewVacancyId === 'all' || a.vacancyId === interviewVacancyId;
      const isSchedulable = SCHEDULABLE_STATUSES.includes(a.applicationStatus ?? '');
      return matchesVacancy && isSchedulable;
    });



  const relevantQuestions = React.useMemo(() => {
    // If interview category is selected, filter questions based on evaluation template criteria
    if (selectedCategoryId) {
      const selectedTemplate = evaluationTemplates.find(
        (template) => template.interview_category_id === selectedCategoryId
      );
      
      if (selectedTemplate && selectedTemplate.criteria.length > 0) {
        const criteriaNames = selectedTemplate.criteria.map((c) => c.name.toLowerCase());
        
        return questionBank.filter((q) => {
          const questionCategory = q.category?.toLowerCase() || '';
          return criteriaNames.some((criteriaName) => 
            questionCategory.includes(criteriaName) || criteriaName.includes(questionCategory)
          );
        });
      }
    }
    
    // If no category selected or no template found, show all questions
    return questionBank;
  }, [selectedCategoryId, evaluationTemplates, questionBank]);



  const handleScheduleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (!schedAppId) return;

    if (selectedPanelIds.length === 0) {
      toast('Please select at least one panel member.', 'error');
      return;
    }

    if (selectedPanelIds.length > 5) {
      toast('Please select maximum 5 panel members.', 'error');
      return;
    }

    if (!schedDate || !schedTime) {
      toast('Please select interview date and time.', 'error');
      return;
    }

    const startDateTime = `${schedDate}T${schedTime}:00+03:00`;
    // Compute end time using duration selector — avoids hardcoded 1-hour offset
    // and handles hour overflow (e.g. 23:30 + 60 min = 00:30 next day).
    const startMs = new Date(`${schedDate}T${schedTime}:00`).getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;
    const endDate = new Date(endMs);
    const endDateTime = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00+03:00`;



    scheduleInterview(

      schedAppId,

      intType,

      startDateTime,

      endDateTime,

      location,

      selectedPanelIds,

      selectedQuestions,

      meetingLink || undefined,

      intType === 'hybrid'

        ? {

            segments: segments.length

              ? segments.map((segment) => ({

                  segmentType: segment.segmentType,

                  start: `${segment.date}T${segment.startTime}:00+03:00`,

                  end: `${segment.date}T${segment.endTime}:00+03:00`,

                  location:

                    segment.segmentType === 'physical'

                      ? segment.location

                      : undefined,

                  meetingLink:

                    segment.segmentType === 'virtual'

                      ? segment.meetingLink ||

                        `https://meet.capitalbank.et/r/${scheduledApp?.candidateName.toLowerCase().replace(/ /g, '-')}`

                      : undefined,

                }))

              : undefined,

          }

        : undefined,

      selectedCategoryId || undefined,

    );



    setSchedAppId('');
    setInterviewVacancyId('all');
    setSelectedPanelIds([]);
    setSelectedQuestions([]);
    setSegments([]);
    setMeetingLink('');
    setLocation('');
    setSelectedCategoryId('');
    toast('Interview scheduled successfully.', 'success');

  };



  return (

    <div className="grid grid-cols-12 gap-6">

        {/* Scheduler Form */}

        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">

          <div className="mb-6">

            <h3 className="text-lg font-bold text-slate-900">

              Schedule Interview

            </h3>

            <p className="text-sm text-slate-500 mt-1">

              Configure interview details and assign panel members

            </p>

          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-6 text-sm">

            {/* Candidate Selection */}

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">

              <div className="flex items-center gap-2 mb-2">

                <span className="material-symbols-outlined text-indigo-600 text-xl">person_search</span>

                <h4 className="font-semibold text-slate-900">Candidate Selection</h4>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Vacancy

                  </label>

                  <select

                    value={interviewVacancyId}

                    onChange={(e) => {

                      setInterviewVacancyId(e.target.value);

                      if (e.target.value === 'all') {

                        setSchedAppId('');

                      }

                    }}

                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                  >

                    <option value="all">All vacancies</option>

                    {vacancies.map((vac) => (

                      <option key={vac.id} value={vac.id}>

                        {vac.title}

                      </option>

                    ))}

                  </select>

                </div>

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Shortlisted Candidate

                  </label>

                  <select

                    value={schedAppId}

                    onChange={(e) => {

                      setSchedAppId(e.target.value);

                      const chosen = applications.find(

                        (app) => app.id === e.target.value,

                      );

                      if (chosen) setInterviewVacancyId(chosen.vacancyId);

                    }}

                    required

                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                  >

                    <option value=""> Choose applicant </option>
                    {filteredInterviewableApplications.length === 0 ? (
                      <option value="" disabled>No shortlisted candidates available for this vacancy</option>
                    ) : (
                      filteredInterviewableApplications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.candidateName} - {app.vacancyTitle}
                        </option>
                      ))
                    )}

                  </select>

                </div>

              </div>

            </div>



            {/* Interview Details */}

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">

              <div className="flex items-center gap-2 mb-2">

                <span className="material-symbols-outlined text-indigo-600 text-xl">event</span>

                <h4 className="font-semibold text-slate-900">Interview Details</h4>

              </div>

              <div className="grid grid-cols-3 gap-4">

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Mode

                  </label>

                  <select

                    value={intType}

                    onChange={(e) => {

                      const next = e.target.value as

                        | 'physical'

                        | 'virtual'

                        | 'hybrid';

                      setIntType(next);

                      if (next !== 'hybrid') {

                        setSegments([]);

                      }

                    }}

                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                  >

                    <option value="virtual">Virtual</option>

                    <option value="physical">Physical</option>

                    <option value="hybrid">Hybrid</option>

                  </select>

                </div>

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Date

                  </label>

                  <input

                    type="date"

                    value={schedDate}

                    onChange={(e) => setSchedDate(e.target.value)}

                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                  />

                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Time (GMT+3)
                  </label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>
              {/* Duration selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Interview Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                >
                  <option value="">Select category (optional)</option>
                  {interviewCategories && interviewCategories.length > 0 ? (interviewCategories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))) : (<option value='' disabled>No categories available</option>)}
                </select>
              </div>

              {intType === 'virtual' && (

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Meeting Link

                  </label>

                  <div className="flex gap-2">

                    <input

                      type="url"

                      value={meetingLink}

                      onChange={(e) => setMeetingLink(e.target.value)}

                      placeholder="https://meet.google.com/..."

                      className="flex-1 text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                    />

                    <button

                      type="button"

                      onClick={handleGenerateMeetingLink}

                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm"

                    >

                      <span className="material-symbols-outlined text-base">link</span>

                      Generate

                    </button>

                  </div>

                </div>

              )}

              {intType === 'physical' && (

                <div className="space-y-2">

                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">

                    Location

                  </label>

                  <input

                    type="text"

                    value={location}

                    onChange={(e) => setLocation(e.target.value)}

                    placeholder="e.g., Private Suite 402, Bole HQ"

                    className="w-full text-sm px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"

                  />

                </div>

              )}

            </div>






                        {/* Panel Selection */}

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">

              <div className="flex items-center justify-between mb-3">

                <div className="flex items-center gap-2">

                  <span className="material-symbols-outlined text-indigo-600 text-xl">groups</span>

                  <h4 className="font-semibold text-slate-900">Interview Panel</h4>

                </div>

                <div className="flex items-center gap-2">

                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    selectedPanelIds.length >= 5
                      ? 'bg-red-100 text-red-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>

                    {selectedPanelIds.length}/5 selected

                  </span>

                  {selectedPanelIds.length >= 5 && (

                    <span className="text-[10px] text-red-600 font-medium">Maximum reached</span>

                  )}

                </div>

              </div>

              <div className="space-y-3">

                <div className="relative">

                  <div className="w-full text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm custom-scrollbar max-h-64 overflow-y-auto">

                    {users.map((u) => (

                      <label

                        key={u.id}

                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0 ${

                          selectedPanelIds.includes(u.id) ? 'bg-indigo-50' : ''

                        }`}

                      >

                        <input

                          type="checkbox"

                          checked={selectedPanelIds.includes(u.id)}

                          onChange={(e) => {

                            if (e.target.checked) {

                              if (selectedPanelIds.length < 5) {

                                setSelectedPanelIds([...selectedPanelIds, u.id]);

                              }

                            } else {

                              setSelectedPanelIds(selectedPanelIds.filter((id) => id !== u.id));

                            }

                          }}

                          disabled={!selectedPanelIds.includes(u.id) && selectedPanelIds.length >= 5}

                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"

                        />

                        <span className="flex-1">{u.userName || `${u.firstName} ${u.lastName}`}</span>

                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{u.roleName || u.roleSlug}</span>

                      </label>

                    ))}

                  </div>

                  {selectedPanelIds.length >= 5 && (

                    <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">

                      <span className="material-symbols-outlined text-sm">warning</span>

                      Maximum 5 panel members allowed. Deselect to choose others.

                    </div>

                  )}

                </div>

                {selectedPanelIds.length > 0 && (

                  <div className="space-y-2">

                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Selected Panel Members:</p>

                    <div className="flex flex-wrap gap-2">

                      {selectedPanelIds.map((id) => {

                        const user = users.find((u) => u.id === id);

                        return (

                          <span

                            key={id}

                            className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm"

                          >

                            <span className="material-symbols-outlined text-sm">person</span>

                            {user?.userName || `${user?.firstName} ${user?.lastName}`}

                            <button

                              type="button"

                              onClick={() =>

                                setSelectedPanelIds(

                                  selectedPanelIds.filter((pid) => pid !== id),

                                )

                              }

                              className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors ml-1"

                              title="Remove"

                            >

                              <span className="material-symbols-outlined text-sm">close</span>

                            </button>

                          </span>

                        );

                      })}

                    </div>

                  </div>

                )}

              </div>

            </div>



            {/* Questions */}

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">

              <div className="flex items-center gap-2">

                <span className="material-symbols-outlined text-indigo-600 text-xl">quiz</span>

                <h4 className="font-semibold text-slate-900">Standardized Questions</h4>

              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">

                {relevantQuestions.map((q) => (

                  <label

                    key={q.id}

                    className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors"

                  >

                    <input

                      type="checkbox"

                      checked={selectedQuestions.includes(q.questionText)}

                      onChange={(e) => {

                        if (e.target.checked) {

                          setSelectedQuestions([

                            ...selectedQuestions,

                            q.questionText,

                          ]);

                        } else {

                          setSelectedQuestions(

                            selectedQuestions.filter(

                              (qt) => qt !== q.questionText,

                            ),

                          );

                        }

                      }}

                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"

                    />

                    <div className="flex-1">

                      <span className="text-sm text-slate-700">{q.questionText}</span>

                      <div className="flex gap-2 mt-1">

                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">

                          {q.category}

                        </span>

                        <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">

                          {q.grade}

                        </span>

                      </div>

                    </div>

                  </label>

                ))}

                {relevantQuestions.length === 0 && (

                  <p className="text-slate-400 italic text-center text-sm py-4">

                    No predefined questions found for this role.

                  </p>

                )}

              </div>

            </div>



            {intType === 'hybrid' && (

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">

                <div className="flex items-center gap-2">

                  <span className="material-symbols-outlined text-indigo-600 text-xl">sync_alt</span>

                  <h4 className="font-semibold text-slate-900">Hybrid Segments</h4>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <select

                    value={newSegmentType}

                    onChange={(e) =>

                      setNewSegmentType(

                        e.target.value as 'physical' | 'virtual',

                      )

                    }

                    className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                  >

                    <option value="virtual">Virtual segment</option>

                    <option value="physical">Physical segment</option>

                  </select>

                  <input

                    type="date"

                    value={newSegmentDate}

                    onChange={(e) => setNewSegmentDate(e.target.value)}

                    className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                  />

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <input

                    type="time"

                    value={newSegmentStartTime}

                    onChange={(e) => setNewSegmentStartTime(e.target.value)}

                    className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                  />

                  <input

                    type="time"

                    value={newSegmentEndTime}

                    onChange={(e) => setNewSegmentEndTime(e.target.value)}

                    className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                  />

                </div>

                {newSegmentType === 'physical' ? (

                  <input

                    type="text"

                    value={newSegmentLocation}

                    onChange={(e) => setNewSegmentLocation(e.target.value)}

                    className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                    placeholder="Location for physical segment"

                  />

                ) : (
                  <div className="flex gap-2">
                    <input

                      type="text"

                      value={newSegmentMeetingLink}

                      onChange={(e) => setNewSegmentMeetingLink(e.target.value)}

                      className="flex-1 px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"

                      placeholder="Optional meeting link"

                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'abcdefghijklmnopqrstuvwxyz';
                        const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                        setNewSegmentMeetingLink(`https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">link</span>
                      Generate
                    </button>
                  </div>

                )}

                {segments.length > 0 && (

                  <div className="space-y-2">

                    {segments.map((seg, index) => (

                      <div

                        key={`${seg.segmentType}-${index}`}

                        className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm"

                      >

                        <div className="flex justify-between items-start gap-3">

                          <div className="flex-1">

                            <div className="flex items-center gap-2 mb-2">

                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${

                                seg.segmentType === 'virtual'

                                  ? 'bg-blue-100 text-blue-700'

                                  : 'bg-emerald-100 text-emerald-700'

                              }`}>

                                {seg.segmentType}

                              </span>

                              <p className="text-sm font-medium text-slate-900">

                                {seg.date} • {seg.startTime} – {seg.endTime}

                              </p>

                            </div>

                            <p className="text-xs text-slate-500">

                              {seg.segmentType === 'physical'

                                ? seg.location

                                : seg.meetingLink || 'Auto-generated link'}

                            </p>

                          </div>

                          <button

                            type="button"

                            onClick={() =>

                              setSegments(

                                segments.filter((_, i) => i !== index),

                              )

                            }

                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"

                          >

                            <span className="material-symbols-outlined">delete</span>

                          </button>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {scheduledApp && (

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">

                <div className="flex items-start gap-3">

                  <span className="material-symbols-outlined text-indigo-600 text-xl mt-0.5">info</span>

                  <div className="flex-1">

                    <p className="font-semibold text-sm text-indigo-900 mb-1">Scheduling Summary</p>

                    <div className="space-y-1 text-xs text-indigo-700">

                      <p><span className="font-medium">Candidate:</span> {scheduledApp.candidateName}</p>

                      <p><span className="font-medium">Role:</span> {scheduledApp.vacancyTitle}</p>

                      <p><span className="font-medium">Panel:</span> {selectedPanelIds.length ? `${selectedPanelIds.length} member(s)` : 'None selected'}</p>

                    </div>

                  </div>

                </div>

              </div>

            )}



            {can(PERMISSIONS.INTERVIEW_CREATE) && (
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-3 text-base font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                Confirm and Dispatch Invitation
              </button>
            )}

          </form>

        </div>



        {/* Upcoming Schedules */}
        {can(PERMISSIONS.INTERVIEW_READ) && (
          <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full">

          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Upcoming Schedules
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {interviews.length} interview(s) scheduled
            </p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {(() => {
              // Sort upcoming first
              const sorted = [...interviews].sort(
                (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
              );
              const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
              const paged = sorted.slice((upcomingPage - 1) * pageSize, upcomingPage * pageSize);
              return (
                <>
                  {paged.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                      <p className="text-sm text-slate-500">No interviews scheduled yet</p>
                    </div>
                  ) : (
                    <>
                      {paged.map((int) => (

                <div
                  key={int.id}
                  onClick={() => {
                    setSelectedInterview(int);
                    setShowInterviewModal(true);
                  }}
                  className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2 mb-1">

                        <span className="material-symbols-outlined text-indigo-500 text-[18px]">person</span>

                        <h4 className="font-semibold text-sm text-slate-900 truncate">

                          {int.candidateName}

                        </h4>

                      </div>

                      <p className="text-[11px] text-slate-500 truncate">

                        {int.vacancyTitle}

                      </p>

                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">

                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
                        {new Date(int.scheduledStart).toLocaleDateString()}
                      </span>

                      <span className="text-[10px] text-slate-600 font-medium">
                        {new Date(int.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                    </div>

                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <span className="material-symbols-outlined text-slate-400 text-[14px]">groups</span>

                      <span className="text-[10px] text-slate-600">
                        {int.panelMembers?.length || 0} panel member(s)
                      </span>

                    </div>

                    <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-500 transition-colors">arrow_forward</span>

                  </div>

                </div>

              ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setUpcomingPage(p => Math.max(1, p - 1))}
                        disabled={upcomingPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-600">
                        Page {upcomingPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUpcomingPage(p => Math.min(totalPages, p + 1))}
                        disabled={upcomingPage === totalPages}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                    </>
                  )}
                </>
              );
            })()}
          </div>

        </div>
        )}

      {/* Interview Details Modal */}
      {showInterviewModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3">
              <div>
                <h3 className="text-base font-bold text-white">Interview Details</h3>
                <p className="text-indigo-100 text-[10px]">{selectedInterview.vacancyTitle}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Candidate Info */}
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">person</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{selectedInterview.candidateName}</p>
                  <p className="text-[10px] text-slate-500">Candidate</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Date</p>
                  <p className="font-semibold text-slate-900 text-xs">
                    {new Date(selectedInterview.scheduledStart).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Time</p>
                  <p className="font-semibold text-slate-900 text-xs">
                    {new Date(selectedInterview.scheduledStart).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Type & Status */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Type</p>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                    {selectedInterview.interviewType?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Status</p>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    selectedInterview.interviewStatus === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    selectedInterview.interviewStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedInterview.interviewStatus}
                  </span>
                </div>
              </div>

              {/* Panel Members */}
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Panel ({selectedInterview.panelMembers?.length || 0})</p>
                <div className="flex flex-wrap gap-1">
                  {selectedInterview.panelMembers?.slice(0, 3).map((panel: any) => (
                    <span key={panel.id} className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded text-[9px] text-slate-700 border border-slate-200">
                      <span className="material-symbols-outlined text-[10px] text-slate-400">person</span>
                      {panel.userName}
                    </span>
                  ))}
                  {(selectedInterview.panelMembers?.length || 0) > 3 && (
                    <span className="text-[9px] text-slate-400">+{selectedInterview.panelMembers.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Meeting Link or Location */}
              {selectedInterview.meetingLink && (
                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-[16px] shrink-0">videocam</span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase text-indigo-400 mb-0">Link</p>
                      <a
                        href={selectedInterview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-700 hover:text-indigo-800 font-medium truncate block"
                      >
                        {selectedInterview.meetingLink}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {selectedInterview.officeLocation && (
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">location_on</span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase text-emerald-400 mb-0">Location</p>
                      <p className="text-[10px] text-emerald-700 font-medium truncate">{selectedInterview.officeLocation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  setSelectedInterview(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );

};






