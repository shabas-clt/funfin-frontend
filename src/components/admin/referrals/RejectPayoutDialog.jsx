import { useState } from 'react';
import { XCircle } from 'lucide-react';

// Collects the mandatory rejection reason (ADMIN.md §9, 1–500 chars) before
// returning the locked funds to the user. The reason is shown to the user on
// their ledger, so it has to be present.
export default function RejectPayoutDialog({ payout, onConfirm, onCancel, rejecting }) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const tooLong = trimmed.length > 500;
  const valid = trimmed.length >= 1 && !tooLong;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reject payout</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Funds return to the user's balance</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            Rejecting <span className="font-semibold">{payout.userName}</span>'s request. The reason below is
            shown to the user on their ledger.
          </p>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Bank name does not match account holder"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[11px] ${tooLong ? 'text-rose-600' : 'text-slate-400'}`}>{trimmed.length}/500</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={rejecting}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(trimmed)}
            disabled={rejecting || !valid}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium"
          >
            {rejecting ? 'Rejecting…' : 'Reject payout'}
          </button>
        </div>
      </div>
    </div>
  );
}
