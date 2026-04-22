import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Plus, Save, X, Edit2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import FieldError from '@/components/shared/FieldError';
import { missionCreateSchema } from '@/lib/validation/schemas';
import { formatNumber } from '@/lib/format';

const MISSION_TYPES = ['daily', 'weekly', 'special'];

function TypeBadge({ type }) {
  const map = {
    daily: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    weekly: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    special: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${map[type] || 'bg-slate-100 text-slate-500'}`}>
      {type}
    </span>
  );
}

function CreateForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(missionCreateSchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      title: '',
      description: '',
      missionType: 'daily',
      targetCount: 1,
      rewardCoins: 0,
      isActive: true,
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await api.post('/admin/gamification/missions', {
        code: values.code.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        missionType: values.missionType,
        targetCount: Number(values.targetCount) || 1,
        rewardCoins: Number(values.rewardCoins) || 0,
        isActive: values.isActive,
      });
      toast.success('Mission created');
      reset();
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create mission');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">New mission</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Code *</label>
            <input
              {...register('code')}
              placeholder="mission_code"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
            />
            <FieldError error={errors.code} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title *</label>
            <input
              {...register('title')}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.title} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type *</label>
            <select
              {...register('missionType')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              {MISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Target count</label>
            <input
              type="number"
              {...register('targetCount', { valueAsNumber: true })}
              placeholder="Target"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reward coins</label>
            <input
              type="number"
              {...register('rewardCoins', { valueAsNumber: true })}
              placeholder="Coins"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description *</label>
            <input
              {...register('description')}
              placeholder="Description"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.description} />
          </div>
          <div className="md:col-span-6 flex items-center justify-between">
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
              Create mission
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditRow({ mission, onSaved, onCancel }) {
  const [title, setTitle] = useState(mission.title);
  const [description, setDescription] = useState(mission.description);
  const [missionType, setMissionType] = useState(mission.missionType || mission.type || 'daily');
  const [targetCount, setTargetCount] = useState(mission.targetCount ?? 1);
  const [rewardCoins, setRewardCoins] = useState(mission.rewardCoins ?? 0);
  const [isActive, setIsActive] = useState(mission.isActive);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if ((title || '').length < 2) return toast.error('Title must be at least 2 characters');
    if ((description || '').length < 2) return toast.error('Description must be at least 2 characters');
    setSaving(true);
    try {
      const diff = {};
      if (title !== mission.title) diff.title = title;
      if (description !== mission.description) diff.description = description;
      if (missionType !== (mission.missionType || mission.type)) diff.missionType = missionType;
      if (Number(targetCount) !== mission.targetCount) diff.targetCount = Number(targetCount);
      if (Number(rewardCoins) !== mission.rewardCoins) diff.rewardCoins = Number(rewardCoins);
      if (isActive !== mission.isActive) diff.isActive = isActive;
      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }
      const res = await api.patch(`/admin/gamification/missions/${mission.id}`, diff);
      toast.success('Mission updated');
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update mission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-slate-50 dark:bg-neutral-900/70">
      <td className="px-3 py-2 font-mono text-xs text-slate-500 align-top">{mission.code}</td>
      <td className="px-3 py-2 align-top">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <select
          value={missionType}
          onChange={(e) => setMissionType(e.target.value)}
          className="px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        >
          {MISSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          value={targetCount}
          onChange={(e) => setTargetCount(Number(e.target.value) || 1)}
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          value={rewardCoins}
          onChange={(e) => setRewardCoins(Number(e.target.value) || 0)}
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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

export default function MissionsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter) params.missionType = filter;
      const res = await api.get('/admin/gamification/missions', { params });
      setRows(res.missions || []);
    } catch {
      toast.error('Failed to load missions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.code || '').toLowerCase().includes(q)
      || (r.title || '').toLowerCase().includes(q)
      || (r.description || '').toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  return (
    <div className="space-y-4">
      <CreateForm onCreated={(m) => setRows((prev) => [m, ...prev])} />

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Missions <span className="text-xs text-slate-500">({filteredRows.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search missions"
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              >
                <option value="">All types</option>
                {MISSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Code</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Target</th>
                  <th className="px-3 py-2.5 font-medium">Reward</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                    </td>
                  </tr>
                )}
                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      No missions.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredRows.map((mission) =>
                    editingId === mission.id ? (
                      <EditRow
                        key={mission.id}
                        mission={mission}
                        onSaved={(updated) => {
                          setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={mission.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{mission.code}</td>
                        <td className="px-3 py-2.5">
                          <div className="text-slate-900 dark:text-white">{mission.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{mission.description}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <TypeBadge type={mission.missionType || mission.type} />
                        </td>
                        <td className="px-3 py-2.5 text-slate-900 dark:text-white">
                          {formatNumber(mission.targetCount)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-900 dark:text-white">
                          {formatNumber(mission.rewardCoins)} coins
                        </td>
                        <td className="px-3 py-2.5">
                          {mission.isActive ? (
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
                            onClick={() => setEditingId(mission.id)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
