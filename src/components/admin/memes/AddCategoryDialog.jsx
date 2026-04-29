import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X } from 'lucide-react';
import { postingCategorySchema } from '../../../lib/validators/memeValidators';

export default function AddCategoryDialog({ title, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(postingCategorySchema),
    defaultValues: {
      code: '',
      name: '',
      sortOrder: 0
    }
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full shadow-xl border border-slate-200 dark:border-neutral-800">
        <div className="border-b border-slate-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('code')}
              placeholder="e.g., joke"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {errors.code && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.code.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Lowercase alphanumeric only, max 50 characters
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Joke"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Sort Order <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register('sortOrder')}
              min="0"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {errors.sortOrder && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.sortOrder.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
