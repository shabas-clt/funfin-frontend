import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { inputClass } from './badges';

// Confirm a money action and collect the reason the audit log requires.
//
// `action` = { title, description, confirmLabel, danger, run(reason) }.
// `run` returns a promise; the dialog closes when it resolves.
export default function ActionDialog({ action, onClose }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReason('');
    setBusy(false);
  }, [action]);

  if (!action) return null;

  const valid = reason.trim().length >= 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await action.run(reason.trim());
      onClose();
    } catch {
      // The caller already showed the error; keep the dialog open to retry.
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={!!action} onClose={busy ? () => {} : onClose} title={action.title}>
      <form onSubmit={submit} className="space-y-4">
        {action.description && (
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            {action.description}
          </div>
        )}
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Reason (saved in the audit log)
          </span>
          <textarea
            autoFocus
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Support ticket #123, duplicate charge"
            className={`${inputClass} mt-1 resize-none`}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid || busy}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${
              action.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {action.confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
