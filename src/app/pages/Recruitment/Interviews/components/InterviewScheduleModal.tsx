import React, { useState } from 'react';
import type { Application, User } from '@/types';

interface InterviewScheduleModalProps {
  appId: string;
  onClose: () => void;
  onSubmit: (data: {
    round: number;
    type: 'virtual' | 'physical' | 'hybrid';
    start: string;
    end: string;
    location: string;
    panelIds: string[];
    meetingLink?: string;
    segments?: {
      segmentType: 'physical' | 'virtual';
      start: string;
      end: string;
      location?: string;
      meetingLink?: string;
    }[];
  }) => void;
  users: User[];
  applications: Application[];
}

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  appId,
  onClose,
  onSubmit,
  users,
  applications,
}) => {
  const app = applications.find((a) => a.id === appId);
  const [scheduleRound, setScheduleRound] = useState(1);
  const [scheduleType, setScheduleType] = useState<'virtual' | 'physical' | 'hybrid'>('virtual');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState('');
  const [schedulePanelIds, setSchedulePanelIds] = useState<string[]>([]);
  const [hybridSegments, setHybridSegments] = useState<
    {
      segmentType: 'physical' | 'virtual';
      start: string;
      end: string;
      location?: string;
      meetingLink?: string;
    }[]
  >([]);

  const handleFormSubmit = () => {
    if (!scheduleStart || !scheduleEnd) return;
    const startIso = new Date(scheduleStart).toISOString();
    const endIso = new Date(scheduleEnd).toISOString();
    const panelIds = schedulePanelIds.length
      ? schedulePanelIds
      : users.slice(0, 1).map((u) => u.id);

    onSubmit({
      round: scheduleRound,
      type: scheduleType,
      start: startIso,
      end: endIso,
      location: scheduleLocation,
      panelIds,
      meetingLink: scheduleMeetingLink || undefined,
      segments: scheduleType === 'hybrid' ? hybridSegments : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 p-6 rounded-xl max-w-2xl w-full space-y-4 shadow-2xl my-8">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <h4 className="font-bold text-indigo-600 text-base">
            Schedule Interview for {app?.candidateName}
          </h4>
          <button onClick={onClose} aria-label="Close scheduler" className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Interview Round</label>
            <input
              type="number"
              min={1}
              value={scheduleRound}
              onChange={(e) => setScheduleRound(Number(e.target.value))}
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Interview Format</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as any)}
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="virtual">Virtual (Online Link)</option>
              <option value="physical">Physical (In-Person)</option>
              <option value="hybrid">Hybrid (Multi-Segment)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Start Time</label>
            <input
              type="datetime-local"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">End Time</label>
            <input
              type="datetime-local"
              value={scheduleEnd}
              onChange={(e) => setScheduleEnd(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Location / Venue</label>
            <input
              value={scheduleLocation}
              onChange={(e) => setScheduleLocation(e.target.value)}
              placeholder="e.g. Private Suite 402, Bole HQ"
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Meeting Link (Virtual Only)</label>
            <input
              value={scheduleMeetingLink}
              onChange={(e) => setScheduleMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={scheduleType === 'physical'}
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-bold text-slate-700">Select Panel Members (Hold Ctrl/Cmd to multi-select)</label>
            <select
              multiple
              value={schedulePanelIds}
              onChange={(e) =>
                setSchedulePanelIds(
                  Array.from(e.target.selectedOptions).map((o) => o.value),
                )
              }
              className="p-2 border border-slate-300 rounded-lg bg-white text-xs h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.roleSlug.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {scheduleType === 'hybrid' && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h5 className="font-bold text-xs text-indigo-600">Hybrid Segment Timeline</h5>
            {hybridSegments.map((seg, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <select
                  value={seg.segmentType}
                  onChange={(e) => {
                    const next = [...hybridSegments];
                    next[idx].segmentType = e.target.value as any;
                    setHybridSegments(next);
                  }}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="virtual">Virtual</option>
                  <option value="physical">Physical</option>
                </select>
                <input
                  type="datetime-local"
                  value={seg.start}
                  onChange={(e) => {
                    const next = [...hybridSegments];
                    next[idx].start = e.target.value;
                    setHybridSegments(next);
                  }}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
                <input
                  type="datetime-local"
                  value={seg.end}
                  onChange={(e) => {
                    const next = [...hybridSegments];
                    next[idx].end = e.target.value;
                    setHybridSegments(next);
                  }}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
                <input
                  value={seg.meetingLink || ''}
                  onChange={(e) => {
                    const next = [...hybridSegments];
                    next[idx].meetingLink = e.target.value;
                    setHybridSegments(next);
                  }}
                  placeholder="Link / Location Room"
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setHybridSegments((prev) => [
                    ...prev,
                    { segmentType: 'virtual', start: '', end: '', meetingLink: '' },
                  ])
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                + Add Segment
              </button>
              <button
                type="button"
                onClick={() => setHybridSegments([])}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Reset Segments
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!scheduleStart || !scheduleEnd}
          >
            Schedule & Dispatch
          </button>
        </div>
      </div>
    </div>
  );
};
