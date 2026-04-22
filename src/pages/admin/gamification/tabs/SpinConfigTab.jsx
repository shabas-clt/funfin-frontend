import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Plus, Trash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { formatNumber } from '@/lib/format';

// The tier editor stays fully controlled — easier than shoe-horning nested
// arrays into react-hook-form, and we lean on the backend to reject invalid
// combos (mystery_box needs minCoins/maxCoins, multiplier needs multiplier >= 1,
// coins need coins > 0). We just enforce non-negative numbers client-side.

const REWARD_TYPES = [
  { value: 'coins', label: 'Fixed coins' },
  { value: 'mystery_box', label: 'Mystery box (range)' },
  { value: 'multiplier', label: 'Multiplier' },
];

function TierRow({ tier, onChange, onRemove }) {
  const set = (patch) => onChange({ ...tier, ...patch });

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
      <td className="px-3 py-2.5">
        <select
          value={tier.rewardType}
          onChange={(e) => set({ rewardType: e.target.value })}
          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        >
          {REWARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={0}
          value={tier.coins}
          onChange={(e) => set({ coins: Number(e.target.value) || 0 })}
          disabled={tier.rewardType === 'mystery_box'}
          className="w-24 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={0}
          value={tier.minCoins ?? ''}
          onChange={(e) => set({ minCoins: e.target.value === '' ? null : Number(e.target.value) })}
          disabled={tier.rewardType !== 'mystery_box'}
          placeholder="—"
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={0}
          value={tier.maxCoins ?? ''}
          onChange={(e) => set({ maxCoins: e.target.value === '' ? null : Number(e.target.value) })}
          disabled={tier.rewardType !== 'mystery_box'}
          placeholder="—"
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          step="0.1"
          min={1}
          value={tier.multiplier ?? ''}
          onChange={(e) => set({ multiplier: e.target.value === '' ? null : Number(e.target.value) })}
          disabled={tier.rewardType !== 'multiplier'}
          placeholder="—"
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={1}
          value={tier.weight}
          onChange={(e) => set({ weight: Number(e.target.value) || 1 })}
          className="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </td>
      <td className="px-3 py-2.5">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={tier.isActive}
            onChange={(e) => set({ isActive: e.target.checked })}
          />
          Active
        </label>
      </td>
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
        >
          <Trash className="w-3 h-3" /> Remove
        </button>
      </td>
    </tr>
  );
}

export default function SpinConfigTab() {
  const [dailyLimit, setDailyLimit] = useState(1);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/gamification/spin-config');
      setDailyLimit(res.dailyLimit ?? 1);
      setTiers(res.rewardTiers || []);
    } catch {
      toast.error('Failed to load spin config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalWeight = tiers.reduce(
    (sum, t) => sum + (t.isActive ? Number(t.weight) || 0 : 0),
    0,
  );

  const updateTier = (idx, next) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? next : t)));
  };
  const removeTier = (idx) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  };
  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        coins: 10,
        weight: 10,
        isActive: true,
        rewardType: 'coins',
        minCoins: null,
        maxCoins: null,
        multiplier: null,
      },
    ]);
  };

  const onSave = async () => {
    if (!tiers.some((t) => t.isActive)) {
      toast.error('At least one active reward tier is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        dailyLimit: Number(dailyLimit) || 1,
        rewardTiers: tiers.map((t) => ({
          coins: Number(t.coins) || 0,
          weight: Number(t.weight) || 1,
          isActive: !!t.isActive,
          rewardType: t.rewardType,
          minCoins: t.rewardType === 'mystery_box' ? Number(t.minCoins) || null : null,
          maxCoins: t.rewardType === 'mystery_box' ? Number(t.maxCoins) || null : null,
          multiplier: t.rewardType === 'multiplier' ? Number(t.multiplier) || null : null,
        })),
      };
      const res = await api.patch('/admin/gamification/spin-config', payload);
      setDailyLimit(res.dailyLimit ?? 1);
      setTiers(res.rewardTiers || []);
      toast.success('Spin config updated');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save spin config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Daily limit per user
            </label>
            <input
              type="number"
              min={1}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value) || 1)}
              className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 md:ml-auto">
            Active weight total: <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(totalWeight)}</span>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save config
          </button>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Reward tiers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Probability = tier weight ÷ sum of active weights.
              </p>
            </div>
            <button
              type="button"
              onClick={addTier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200"
            >
              <Plus className="w-4 h-4" /> Add tier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Coins</th>
                  <th className="px-3 py-2.5 font-medium">Min</th>
                  <th className="px-3 py-2.5 font-medium">Max</th>
                  <th className="px-3 py-2.5 font-medium">Multiplier</th>
                  <th className="px-3 py-2.5 font-medium">Weight</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                    </td>
                  </tr>
                )}
                {!loading && tiers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500 text-sm">
                      No tiers configured. Add at least one.
                    </td>
                  </tr>
                )}
                {!loading &&
                  tiers.map((tier, idx) => (
                    <TierRow
                      key={idx}
                      tier={tier}
                      onChange={(next) => updateTier(idx, next)}
                      onRemove={() => removeTier(idx)}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
