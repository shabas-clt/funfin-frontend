import { AlertTriangle } from 'lucide-react';

export default function DeleteMemeDialog({ meme, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Meme</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this meme?
          </p>
          <div className="mt-3 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{meme.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              by {meme.user?.fullName || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}