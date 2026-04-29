import { Eye, Trash2 } from 'lucide-react';

export default function MemesTable({ memes, onViewDetails, onDelete }) {
  const truncate = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto px-2">
        <table className="w-full text-[13px] text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-neutral-800">
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                User
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Title
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Content
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categories
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Likes
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Created
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
            {memes.map((meme) => (
              <tr key={meme.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {meme.user?.profilePicUrl ? (
                        <img
                          className="w-9 h-9 rounded-full object-cover shadow-sm"
                          src={meme.user.profilePicUrl}
                          alt={meme.user.fullName}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center">
                          <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                            {meme.user?.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {meme.user?.fullName || 'Unknown'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">#{meme.userId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-900 dark:text-slate-100">{truncate(meme.title, 50)}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-500 dark:text-slate-400">{truncate(meme.content, 100)}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    <span className="inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      {meme.category}
                    </span>
                    <span className="inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      {meme.postingCategory}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {meme.likesCount || 0}
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {new Date(meme.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(meme)}
                      className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center"
                      title="View details"
                      aria-label="View"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </button>
                    <button
                      onClick={() => onDelete(meme)}
                      className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}