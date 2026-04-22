import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Plus, Save, X, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import {
  funcoinCategoryCreateSchema,
  funcoinCategoryUpdateSchema,
} from '@/lib/validation/schemas';
import FieldError from '@/components/shared/FieldError';

function KindBadge({ kind }) {
  const cls =
    kind === 'earn'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
      : 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {kind}
    </span>
  );
}

function EditRow({ category, onSaved, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(funcoinCategoryUpdateSchema),
    defaultValues: {
      name: category.name,
      kind: category.kind,
      description: category.description || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder ?? 0,
    },
  });

  const onSubmit = async (values) => {
    // Only send fields that actually changed so we don't overwrite fields
    // the admin didn't touch.
    const diff = {};
    if (values.name !== category.name) diff.name = values.name;
    if (values.kind !== category.kind) diff.kind = values.kind;
    if ((values.description || '') !== (category.description || '')) {
      diff.description = values.description || '';
    }
    if (values.isActive !== category.isActive) diff.isActive = values.isActive;
    if (Number(values.sortOrder) !== (category.sortOrder ?? 0)) {
      diff.sortOrder = Number(values.sortOrder);
    }
    if (Object.keys(diff).length === 0) {
      toast.info('No changes to save');
      return;
    }
    try {
      const res = await api.patch(`/funcoin/categories/${category.code}`, diff);
      toast.success('Category updated');
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update category');
    }
  };

  return (
    <tr className="bg-indigo-50/40 dark:bg-indigo-950/20">
      <td className="px-3 py-2 align-top text-xs font-mono text-slate-500">
        {category.code}
      </td>
      <td className="px-3 py-2 align-top">
        <input
          {...register('name')}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
        <FieldError error={errors.name} />
      </td>
      <td className="px-3 py-2 align-top">
        <select
          {...register('kind')}
          className="px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        >
          <option value="earn">earn</option>
          <option value="spend">spend</option>
        </select>
      </td>
      <td className="px-3 py-2 align-top">
        <input
          {...register('description')}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          placeholder="(optional)"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" {...register('isActive')} />
          Active
        </label>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-xs"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(funcoinCategoryCreateSchema),
    defaultValues: {
      code: '',
      name: '',
      kind: 'earn',
      description: '',
      isActive: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await api.post('/funcoin/categories', {
        ...values,
        description: values.description?.trim() || undefined,
        sortOrder: Number(values.sortOrder) || 0,
      });
      toast.success('Category created');
      reset();
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create category');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          New category
        </h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-1">
            <input
              {...register('code')}
              placeholder="code"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
            />
            <FieldError error={errors.code} />
          </div>
          <div className="md:col-span-2">
            <input
              {...register('name')}
              placeholder="Display name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.name} />
          </div>
          <div>
            <select
              {...register('kind')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="earn">earn</option>
              <option value="spend">spend</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              placeholder="Order"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
          <div className="md:col-span-6">
            <input
              {...register('description')}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CategoriesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/funcoin/categories');
      setRows(res.categories || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = (newRow) => {
    setRows((prev) => {
      // Keep order stable-ish by sortOrder then name.
      const next = [...prev, newRow];
      next.sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.name).localeCompare(String(b.name)),
      );
      return next;
    });
  };

  const handleSaved = (updated) => {
    setRows((prev) => prev.map((r) => (r.code === updated.code ? updated : r)));
    setEditingCode(null);
  };

  return (
    <div className="space-y-4">
      <CreateForm onCreated={handleCreated} />

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Kind</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                    No categories yet.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) =>
                  editingCode === row.code ? (
                    <EditRow
                      key={row.code}
                      category={row}
                      onSaved={handleSaved}
                      onCancel={() => setEditingCode(null)}
                    />
                  ) : (
                    <tr key={row.code} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{row.code}</td>
                      <td className="px-3 py-2.5 text-slate-900 dark:text-white">{row.name}</td>
                      <td className="px-3 py-2.5">
                        <KindBadge kind={row.kind} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                        {row.description || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                        {row.sortOrder ?? 0}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingCode(row.code)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
