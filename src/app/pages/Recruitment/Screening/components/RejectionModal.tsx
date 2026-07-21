import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { RejectionData } from '../types/screening.types';

interface RejectionModalProps {
  isOpen: boolean;
  candidateName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionData) => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  candidateName,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = React.useState('');
  const [reason, setReason] = React.useState('Lack of direct experience');
  const [addToTalentRoster, setAddToTalentRoster] = React.useState(true);
  const [futureFitTag, setFutureFitTag] = React.useState('Wealth Advisory');

  const rejectionReasons = [
    'Lack of direct experience',
    'Skills mismatch',
    'Salary expectations too high',
    'Insufficient qualifications',
    'Cultural fit concerns',
    'Position filled internally',
    'Budget constraints',
    'Candidate withdrew',
    'Poor communication skills',
    'Failed background check',
    'Other',
  ];

  React.useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setReason('Lack of direct experience');
      setAddToTalentRoster(true);
      setFutureFitTag('Wealth Advisory');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit({
      notes,
      reason,
      addToTalentRoster,
      futureFitTag,
    });
  };

  const fieldInputStyle =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10';
  const labelHeaderStyle =
    'block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidateName ? `Reject ${candidateName}` : 'Reject Candidate'}
      size="sm"
    >
      <div className="space-y-4 text-slate-800 antialiased p-1">
        <div>
          <label className={labelHeaderStyle}>Rejection Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${fieldInputStyle} appearance-none cursor-pointer`}
          >
            {rejectionReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelHeaderStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional feedback for the candidate..."
            rows={3}
            className={`${fieldInputStyle} resize-none leading-relaxed`}
          />
        </div>

        <div className="flex items-start gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-xl transition-colors hover:bg-slate-50">
          <input
            type="checkbox"
            id="addToTalentRoster"
            checked={addToTalentRoster}
            onChange={(e) => setAddToTalentRoster(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer mt-0.5"
          />
          <label
            htmlFor="addToTalentRoster"
            className="text-xs text-slate-600 font-medium cursor-pointer select-none leading-normal"
          >
            Add to talent pool for future opportunities
          </label>
        </div>

        

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm shadow-rose-600/10 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Rejecting…' : 'Reject Candidate'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
