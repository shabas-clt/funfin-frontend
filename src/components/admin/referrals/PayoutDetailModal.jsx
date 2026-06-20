import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  Check, X, RotateCcw, BadgeCheck, ShieldCheck, Building2, Loader2, AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { referralApi } from '@/api/referralApi';
import { formatUsd, formatShortDateTime } from '@/lib/format';
import RiskBadge, { getRiskConfig } from './RiskBadge';
import RejectPayoutDialog from './RejectPayoutDialog';

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-50 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm text-right text-slate-900 dark:text-slate-100 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function PayoutDetailModal({ payoutId, initialPayout, onClose, onUpdated }) {
  const [payout, setPayout] = useState(initialPayout || null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // 'verify' | 'reassess' | 'approve' | 'reject'
  const [note, setNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  // Surface the freshly re-scored payout to the parent list as well.
  const apply = useCallback((updated) => {
    setPayout(updated);
    onUpdated?.(updated);
  }, [onUpdated]);

  // §6 — open the detail view with the fraud assessment recomputed fresh.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const fresh = await referralApi.getPayout(payoutId);
        if (active) apply(fresh);
      } catch (error) {
        if (active) toast.error(typeof error === 'string' ? error : 'Failed to load payout');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutId]);

  if (!payout && loading) {
    return (
      <Modal isOpen onClose={onClose} title="Payout review" className="max-w-2xl">
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Modal>
    );
  }

  if (!payout) {
    return (
      <Modal isOpen onClose={onClose} title="Payout review" className="max-w-2xl">
        <p className="py-10 text-center text-slate-400 dark:text-slate-500">Failed to load payout.</p>
      </Modal>
    );
  }

  const isPending = payout.status === 'pending_review';
  const riskConfig = getRiskConfig(payout.riskLevel);

  const verifyBank = async (verified) => {
    setBusy('verify');
    try {
      const updated = await referralApi.verifyBank(payoutId, { verified, note: note.trim() || undefined });
      apply(updated);
      toast.success(verified ? 'Bank account verified' : 'Verification cleared');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update verification');
    } finally {
      setBusy(null);
    }
  };

  const reassess = async () => {
    setBusy('reassess');
    try {
      const updated = await referralApi.reassess(payoutId);
      apply(updated);
      toast.success('Fraud assessment refreshed');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to reassess');
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    // Extra confirm for high-risk payouts (ADMIN.md §10 guidance).
    if (payout.riskLevel === 'high') {
      const result = await Swal.fire({
        title: 'Approve a high-risk payout?',
        text: 'This payee tripped high-risk fraud signals. Releasing the funds is irreversible.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'Yes, approve',
        cancelButtonText: 'Cancel',
      });
      if (!result.isConfirmed) return;
    }

    setBusy('approve');
    try {
      const updated = await referralApi.approve(payoutId);
      apply(updated);
      toast.success('Payout approved — funds released');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to approve payout');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (reason) => {
    setBusy('reject');
    try {
      const updated = await referralApi.reject(payoutId, { reason });
      apply(updated);
      setShowReject(false);
      toast.success('Payout rejected — funds returned to user');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to reject payout');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Modal isOpen onClose={onClose} title="Payout review" className="max-w-2xl">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Amount + payee + status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatUsd(payout.amount)}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{payout.userName}</p>
              <p className="text-xs text-slate-400">{payout.userEmail}</p>
            </div>
            <RiskBadge level={payout.riskLevel} score={payout.riskScore} />
          </div>

          {/* Bank snapshot */}
          <div className="rounded-xl border border-slate-100 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" /> Bank account
              </h4>
              {payout.bankVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                  Unverified
                </span>
              )}
            </div>
            <Row label="Account holder" value={payout.bankAccountHolder} />
            <Row label="Account no." value={payout.bankAccountLast4 ? `•••• ${payout.bankAccountLast4}` : '—'} mono />
            <Row label="IFSC" value={payout.bankIfsc} mono />
            <Row label="Bank" value={payout.bankName} />
          </div>

          {/* Fraud assessment */}
          <div className={`rounded-xl border p-4 ${
            payout.riskLevel === 'high'
              ? 'border-rose-200 dark:border-rose-900/50'
              : 'border-slate-100 dark:border-neutral-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" /> Fraud assessment
              </h4>
              <span className={`text-xs font-semibold ${riskConfig.class.split(' ').find((c) => c.startsWith('text-'))}`}>
                Score {payout.riskScore ?? '—'} / 100
              </span>
            </div>
            {payout.riskFlags?.length ? (
              <ul className="space-y-2">
                {payout.riskFlags.map((flag) => (
                  <li key={flag.code} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700 dark:text-slate-200">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{flag.code}</span>
                        <span className="ml-2 text-xs text-slate-400">+{flag.weight}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{flag.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No fraud signals fired.</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-100 dark:border-neutral-800 p-4">
            <Row label="Requested" value={formatShortDateTime(payout.requestedAt)} />
            <Row label="Processed" value={payout.processedAt ? formatShortDateTime(payout.processedAt) : '—'} />
            <Row label="Processed by" value={payout.processedBy} mono />
            {payout.rejectionReason && <Row label="Rejection reason" value={payout.rejectionReason} />}
          </div>

          {/* Actions — only for pending requests */}
          {isPending ? (
            <div className="space-y-3">
              {/* Bank verification */}
              {!payout.bankVerified && (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Verification note (optional) — e.g. Name matches PAN"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                {payout.bankVerified ? (
                  <button
                    onClick={() => verifyBank(false)}
                    disabled={!!busy}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {busy === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Clear verification
                  </button>
                ) : (
                  <button
                    onClick={() => verifyBank(true)}
                    disabled={!!busy}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {busy === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                    Verify bank
                  </button>
                )}
                <button
                  onClick={reassess}
                  disabled={!!busy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {busy === 'reassess' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Reassess
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowReject(true)}
                  disabled={!!busy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={approve}
                  disabled={!!busy || !payout.bankVerified}
                  title={!payout.bankVerified ? 'Verify the bank account before approving' : undefined}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
              </div>
              {!payout.bankVerified && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  The bank account must be verified before this payout can be approved.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-center text-slate-400 dark:text-slate-500">
              This payout is <span className="font-semibold">{payout.status}</span> and can no longer be actioned.
            </p>
          )}
        </div>
      </Modal>

      {showReject && (
        <RejectPayoutDialog
          payout={payout}
          rejecting={busy === 'reject'}
          onConfirm={reject}
          onCancel={() => setShowReject(false)}
        />
      )}
    </>
  );
}
