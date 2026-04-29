import { X } from 'lucide-react';

export default function MemeDetailsModal({ meme, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-neutral-800">
        <div className="sticky top-0 bg-white dark:bg-neutral-950 border-b border-slate-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Meme Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">User</h3>
            <div className="flex items-center gap-3">
              {meme.user?.profilePicUrl ? (
                <img
                  src={meme.user.profilePicUrl}
                  alt={meme.user.fullName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center">
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                    {meme.user?.fullName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{meme.user?.fullName || 'Unknown'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{meme.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Title</h3>
            <p className="text-slate-900 dark:text-white">{meme.title}</p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Content</h3>
            <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{meme.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Content Category</h3>
              <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                {meme.category}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Posting Category</h3>
              <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                {meme.postingCategory}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Likes</h3>
              <p className="text-slate-900 dark:text-white font-semibold">{meme.likesCount || 0}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Created At</h3>
              <p className="text-slate-900 dark:text-white">
                {new Date(meme.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {meme.updatedAt && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Updated At</h3>
              <p className="text-slate-900 dark:text-white">
                {new Date(meme.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 dark:bg-neutral-900 px-6 py-4 border-t border-slate-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}