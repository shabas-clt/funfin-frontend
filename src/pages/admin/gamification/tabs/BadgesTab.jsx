import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Plus, Save, Edit2, X, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import FieldError from '@/components/shared/FieldError';
import { badgeCreateSchema } from '@/lib/validation/schemas';

function CreateForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(badgeCreateSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      iconUrl: '',
      isActive: true,
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
        isActive: values.isActive,
      };
      if (values.description?.trim()) payload.description = values.description.trim();
      if (values.iconUrl?.trim()) payload.iconUrl = values.iconUrl.trim();
      const res = await api.post('/admin/gamification/badges', payload);
      toast.success('Badge created');
      reset();
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create badge');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">New badge</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <input
              {...register('code')}
              placeholder="badge_code"
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
              {...register('iconUrl')}
              placeholder="Icon URL (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.iconUrl} />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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

function EditCard({ badge, onSaved, onCancel }) {
  const [name, setName] = useState(badge.name);
  const [description, setDescription] = useState(badge.description || '');
  const [iconUrl, setIconUrl] = useState(badge.iconUrl || '');
  const [isActive, setIsActive] = useState(badge.isActive);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if ((name || '').length < 2) return toast.error('Name must be at least 2 characters');
    setSaving(true);
    try {
      const diff = {};
      if (name !== badge.name) diff.name = name;
      if (description !== (badge.description || '')) diff.description = description;
      if (iconUrl !== (badge.iconUrl || '')) diff.iconUrl = iconUrl;
      if (isActive !== badge.isActive) diff.isActive = isActive;
      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }
      const res = await api.patch(`/admin/gamification/badges/${badge.id}`, diff);
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update badge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-slate-500">{badge.code}</div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
      />
      <input
        value={iconUrl}
        onChange={(e) => setIconUrl(e.target.value)}
        placeholder="Icon URL"
        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-xs"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

export default function BadgesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/gamification/badges');
      setRows(res.badges || []);
    } catch {
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <CreateForm onCreated={(b) => setRows((prev) => [...prev, b])} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && (
          <div className="col-span-full p-8 text-center text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-slate-500">
            No badges yet.
          </div>
        )}
        {!loading &&
          rows.map((badge) =>
            editingId === badge.id ? (
              <EditCard
                key={badge.id}
                badge={badge}
                onSaved={(updated) => {
                  setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card key={badge.id} className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {badge.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{badge.code}</div>
                    </div>
                    {badge.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  {badge.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{badge.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(badge.id)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </CardContent>
              </Card>
            ),
          )}
      </div>
    </div>
  );
}
