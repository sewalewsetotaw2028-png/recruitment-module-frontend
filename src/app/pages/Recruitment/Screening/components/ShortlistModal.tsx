import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ShortlistData {
  notes: string;
}

interface ShortlistModalProps {
  isOpen: boolean;
  candidateName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: ShortlistData) => void;
}

export const ShortlistModal: React.FC<ShortlistModalProps> = ({
  isOpen,
  candidateName,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit({
      notes,
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
      title={candidateName ? `Shortlist ${candidateName}` : 'Shortlist Candidate'}
      size="sm"
    >
      <div className="space-y-4 text-slate-800 antialiased p-1">
        <div>
          <label className={labelHeaderStyle}>Shortlist Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about why this candidate is being shortlisted..."
            rows={3}
            className={`${fieldInputStyle} resize-none leading-relaxed`}
          />
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
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-600/10 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Shortlisting…' : 'Shortlist Candidate'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
