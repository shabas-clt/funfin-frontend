import { AlertTriangle } from 'lucide-react';

export default function DeleteCertificateDialog({ certificate, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete certificate</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 dark:text-slate-300">
            Delete this certificate? The record and its PDF will be removed. The
            student can regenerate it later if they completed the course.
          </p>
          <div className="mt-3 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800">
            <p className="text-sm font-mono font-medium text-slate-900 dark:text-white">{certificate.certificateId}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {certificate.studentName} — {certificate.courseTitle}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
