import { Trash2 } from 'lucide-react';

export default function CategoriesTable({ categories, onDelete }) {
  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto px-2">
        <table className="w-full text-[13px] text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-neutral-800">
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Code
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Name
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sort Order
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
            {categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <code className="text-sm font-mono bg-slate-100 dark:bg-neutral-900 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                      {category.code}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-400'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {category.sortOrder}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onDelete(category.id)}
                      className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center inline-flex"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
