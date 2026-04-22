import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Plus, Save, Edit2, X, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import FieldError from '@/components/shared/FieldError';
import { titleCreateSchema } from '@/lib/validation/schemas';

function CreateForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(titleCreateSchema),
    defaultValues: { code: '', name: '', description: '', isActive: true },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
        isActive: values.isActive,
      };
      if (values.description?.trim()) payload.description = values.description.trim();
      const res = await api.post('/admin/gamification/titles', payload);
      toast.success('Title created');
      reset();
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create title');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">New title</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <input
              {...register('code')}
              placeholder="title_code"
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
          <div className="md:col-span-2">
            <input
              {...register('description')}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-5 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('isActive')} />
              Active on creation
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add title
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditRow({ title, onSaved, onCancel }) {
  const [name, setName] = useState(title.name);
  const [description, setDescription] = useState(title.description || '');
  const [isActive, setIsActive] = useState(title.isActive);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if ((name || '').length < 2) return toast.error('Name must be at least 2 characters');
    setSaving(true);
    try {
      const diff = {};
      if (name !== title.name) diff.name = name;
      if (description !== (title.description || '')) diff.description = description;
      if (isActive !== title.isActive) diff.isActive = isActive;
      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }
      const res = await api.patch(`/admin/gamification/titles/${title.id}`, diff);
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update title');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-indigo-50/40 dark:bg-indigo-950/20">
      <td className="px-3 py-2 font-mono text-xs text-slate-500 align-top">{title.code}</td>
      <td className="px-3 py-2 align-top">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
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

export default function TitlesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/gamification/titles');
      setRows(res.titles || []);
    } catch {
      toast.error('Failed to load titles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <CreateForm onCreated={(t) => setRows((prev) => [...prev, t])} />

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500 text-sm">
                    <Crown className="w-5 h-5 inline mr-1 opacity-50" /> No titles yet.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((title) =>
                  editingId === title.id ? (
                    <EditRow
                      key={title.id}
                      title={title}
                      onSaved={(updated) => {
                        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={title.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{title.code}</td>
                      <td className="px-3 py-2.5 text-slate-900 dark:text-white">{title.name}</td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                        {title.description || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {title.isActive ? (
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
                          onClick={() => setEditingId(title.id)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
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
