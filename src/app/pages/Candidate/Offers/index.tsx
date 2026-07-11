import React, { useEffect, useState } from 'react';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { useToast } from '@/components/common/Toast';
import { PRIMARY_COLOR_HEX } from '@/config/theme';
import Modal from '@/components/ui/Modal/Modal';

interface Offer {
  id: string;
  salary: number;
  start_date: string;
  expiry_date: string;
  status: string;
  offer_notes?: string;
  declined_reason?: string;
  application?: {
    vacancy?: {
      title: string;
      location?: string;
      department?: {
        name: string;
      };
    };
  };
}

export const CandidateOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptTargetId, setAcceptTargetId] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const getRemainingTime = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    if (diff < 60000) return 'Expiring soon';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeCall<Offer[]>({
        method: 'GET',
        route: API_ROUTES.candidates.offers,
        isSecureRoute: true,
      });
      // Extract array from response payload
      const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
      setOffers(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAcceptConfirm = async () => {
    if (!acceptTargetId) return;
    try {
      setSubmitting(true);
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.acceptOffer(acceptTargetId),
        isSecureRoute: true,
      });
      toast('Offer accepted successfully! Congratulations!', 'success');
      setShowAcceptModal(false);
      setAcceptTargetId(null);
      fetchOffers();
    } catch (err: any) {
      toast(err?.message || 'Failed to accept offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineSubmit = async () => {
    if (!selectedOfferId) return;
    try {
      setSubmitting(true);
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.rejectOffer(selectedOfferId),
        isSecureRoute: true,
        data: { reason: declineReason },
      });
      toast('Offer declined.', 'info');
      setShowDeclineModal(false);
      setDeclineReason('');
      fetchOffers();
    } catch (err: any) {
      toast(err?.message || 'Failed to decline offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DECLINED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      <PageSectionHeader
        eyebrow="Candidate Portal"
        title="Job Offers"
        description="Review, accept, or decline job offers issued to you by the recruitment team."
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading your offers…
        </div>
      ) : (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <span className="material-symbols-outlined text-slate-300 text-3xl block">
                local_offer
              </span>
              <p className="text-slate-400 text-sm font-medium">
                No job offers have been issued to you yet.
              </p>
            </div>
          ) : (
            offers.map((offer) => {
              const isPending = offer.status.toUpperCase() === 'SENT';
              const isExpired = new Date() > new Date(offer.expiry_date);
              const statusDisplay = isPending && isExpired ? 'EXPIRED' : offer.status;

              return (
                <div
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                        {offer.application?.vacancy?.title || 'Job Offer'}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium mt-0.5">
                        {offer.application?.vacancy?.department?.name || 'Department'} •{' '}
                        {offer.application?.vacancy?.location || 'Location'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide border font-mono ${getStatusBadge(
                        statusDisplay,
                      )}`}
                    >
                      {statusDisplay.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[10px]">
                        Base Salary
                      </span>
                      <p className="font-bold text-slate-900 mt-1 text-sm">
                        ETB {offer.salary.toLocaleString()}/year
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[10px]">
                        Proposed Start Date
                      </span>
                      <p className="font-medium text-slate-700 mt-1">
                        {new Date(offer.start_date).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[10px]">
                        Offer Expiry Date
                      </span>
                      <p className="font-medium text-slate-700 mt-1">
                        {new Date(offer.expiry_date).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>

                  {offer.offer_notes && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                      <span className="font-bold text-slate-600 block mb-1">Notes from the hiring team:</span>
                      <p className="text-slate-500 leading-relaxed">{offer.offer_notes}</p>
                    </div>
                  )}

                  {isPending && !isExpired && (
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOfferId(offer.id);
                          setShowDeclineModal(true);
                        }}
                        disabled={submitting}
                        className="px-4 py-2 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Decline Offer
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcceptTargetId(offer.id);
                          setShowAcceptModal(true);
                        }}
                        disabled={submitting}
                        className="px-4 py-2 !text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        style={{ backgroundColor: PRIMARY_COLOR_HEX }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'none';
                        }}
                      >
                        Accept Offer
                      </button>
                    </div>
                  )}

                  {offer.status.toUpperCase() === 'DECLINED' && offer.declined_reason && (
                    <div className="bg-rose-50/30 rounded-xl p-3 border border-rose-100/50 text-xs">
                      <span className="font-bold text-rose-800 block mb-1">Reason for declining:</span>
                      <p className="text-rose-700/80">{offer.declined_reason}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Decline Offer</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Please provide a brief reason for declining this offer. Your feedback is highly appreciated.
              </p>
            </div>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="E.g., I accepted another offer, salary expectations, etc."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                disabled={submitting}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={submitting || !declineReason.trim()}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 !text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                Decline Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-xl">handshake</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">Accept Job Offer</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  By accepting this offer, you officially confirm your intent to join the company.
                  A formal employment contract will be generated and sent to you shortly.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">info</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                This action is binding. You will not be able to undo it once confirmed.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAcceptModal(false);
                  setAcceptTargetId(null);
                }}
                disabled={submitting}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptConfirm}
                disabled={submitting}
                className="px-3.5 py-1.5 !text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR_HEX }}
              >
                {submitting ? 'Accepting…' : 'Yes, Accept Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Details Modal */}
      <Modal
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        title="Job Offer Details"
        size="lg"
      >
        {selectedOffer && (() => {
          const isPending = selectedOffer.status.toUpperCase() === 'SENT';
          const isExpired = new Date() > new Date(selectedOffer.expiry_date);
          const statusDisplay = isPending && isExpired ? 'EXPIRED' : selectedOffer.status;
          return (
            <div className="space-y-6 text-slate-700 text-xs animate-fadeIn">
              {/* Header info */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedOffer.application?.vacancy?.title || 'Job Offer'}
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-0.5">
                  {selectedOffer.application?.vacancy?.department?.name || 'Department'} • {selectedOffer.application?.vacancy?.location || 'Location'}
                </p>
              </div>

              {/* Status Badge & Countdown Banner */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[9px] border uppercase tracking-wider font-mono w-max ${getStatusBadge(
                      statusDisplay,
                    )}`}
                  >
                    {statusDisplay.toUpperCase()}
                  </span>
                </div>
                {isPending && !isExpired && (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                      Time Remaining
                    </span>
                    <span className="font-bold text-amber-600 font-mono text-xs">
                      {getRemainingTime(selectedOffer.expiry_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Financial & Date Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                    Annual Salary
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5 text-sm">
                    ETB {selectedOffer.salary.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                    Proposed Start Date
                  </span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {new Date(selectedOffer.start_date).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block font-mono text-[9px]">
                    Offer Expiry Date
                  </span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {new Date(selectedOffer.expiry_date).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>
              </div>

              {/* Offer Notes */}
              {selectedOffer.offer_notes && (
                <div className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl">
                  <span className="font-bold text-slate-600 block mb-1">Notes from the hiring team:</span>
                  <p className="text-slate-500 leading-relaxed">{selectedOffer.offer_notes}</p>
                </div>
              )}

              {/* Decline Reason (if declined) */}
              {selectedOffer.status.toUpperCase() === 'DECLINED' && selectedOffer.declined_reason && (
                <div className="bg-rose-50/40 border border-rose-100/50 p-3.5 rounded-xl">
                  <span className="font-bold text-rose-800 block mb-1">Reason for declining:</span>
                  <p className="text-rose-700/80">{selectedOffer.declined_reason}</p>
                </div>
              )}

              {/* Terms of Agreement Disclaimer */}
              {isPending && !isExpired && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h4 className="font-bold text-slate-900">Employment Agreement Disclaimer</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50/30 border border-slate-100 p-3 rounded-xl">
                    By clicking "Accept Offer", you officially confirm your intent to join the company under the specified compensation and benefits structure. A formal contract will be generated and routed to you shortly. You may decline this offer if you no longer wish to pursue this opportunity.
                  </p>
                </div>
              )}

              {/* Action Buttons in Modal */}
              {isPending && !isExpired && (
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOfferId(selectedOffer.id);
                      setShowDeclineModal(true);
                      setSelectedOffer(null);
                    }}
                    disabled={submitting}
                    className="px-4 py-2 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Decline Offer
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAcceptTargetId(selectedOffer.id);
                      setSelectedOffer(null);
                      setShowAcceptModal(true);
                    }}
                    disabled={submitting}
                    className="px-4 py-2 !text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY_COLOR_HEX }}
                  >
                    Accept Offer
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default CandidateOffersPage;
