import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Save, AlertCircle } from 'lucide-react';
import { referralConfigSchema } from '../../../lib/validators/referralValidators';
import { formatUsd, formatShortDateTime } from '@/lib/format';

// Single numeric field with label, hint and inline error.
function NumberField({ label, name, register, error, hint, suffix, ...inputProps }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          type="number"
          {...register(name)}
          {...inputProps}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error.message}</p>}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}

export default function ConfigForm({ config, onSave }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(referralConfigSchema),
    defaultValues: {
      isEnabled: config.isEnabled,
      rewardAmount: config.rewardAmount,
      tier1Percent: config.tier1Percent,
      tier2Percent: config.tier2Percent,
      tier1Cap: config.tier1Cap,
      tier2Cap: config.tier2Cap,
      networkCap: config.networkCap,
      minPayoutUsd: config.minPayoutUsd,
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      // Error surfaced by parent via toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Current Configuration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <SummaryItem
            label="System Status"
            value={
              config.isEnabled ? (
                <span className="text-emerald-600 dark:text-emerald-400">Enabled</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">Disabled</span>
              )
            }
          />
          <SummaryItem label="Tier 1 Commission" value={`${config.tier1Percent}%`} />
          <SummaryItem label="Tier 2 Commission" value={`${config.tier2Percent}%`} />
          <SummaryItem label="Min Payout" value={formatUsd(config.minPayoutUsd)} />
          <SummaryItem label="Caps (T1 / T2 / Network)" value={`${config.tier1Cap} / ${config.tier2Cap} / ${config.networkCap}`} />
          <SummaryItem label="Welcome Bonus (legacy)" value={`${config.rewardAmount} coins`} />
          <div className="col-span-2 sm:col-span-3">
            <p className="text-slate-500 dark:text-slate-400">Last Updated</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">{formatShortDateTime(config.updatedAt)}</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Update Configuration</h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isEnabled')}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-slate-300 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Referral System</span>
            </label>
            {errors.isEnabled && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.isEnabled.message}</p>
            )}
          </div>

          {/* Commission */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Commission (one-time, % of first purchase)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField
                label="Tier 1 — direct"
                name="tier1Percent"
                register={register}
                error={errors.tier1Percent}
                step="0.1"
                min="0"
                max="100"
                suffix="%"
              />
              <NumberField
                label="Tier 2 — indirect"
                name="tier2Percent"
                register={register}
                error={errors.tier2Percent}
                step="0.1"
                min="0"
                max="100"
                suffix="%"
              />
            </div>
          </div>

          {/* Caps */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Referral caps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NumberField label="Tier 1 cap" name="tier1Cap" register={register} error={errors.tier1Cap} step="1" min="0" max="1000" />
              <NumberField label="Tier 2 cap" name="tier2Cap" register={register} error={errors.tier2Cap} step="1" min="0" max="10000" />
              <NumberField label="Network cap" name="networkCap" register={register} error={errors.networkCap} step="1" min="0" max="10000" />
            </div>
          </div>

          {/* Payout + legacy bonus */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Payout &amp; welcome bonus</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField
                label="Minimum payout"
                name="minPayoutUsd"
                register={register}
                error={errors.minPayoutUsd}
                hint="Min available balance before a user can request a payout"
                step="0.01"
                min="0"
                max="1000000"
                suffix="USD"
              />
              <NumberField
                label="Welcome bonus (legacy coins)"
                name="rewardAmount"
                register={register}
                error={errors.rewardAmount}
                hint="Gamification FunCoin bonus — not money (0–10,000 coins)"
                step="1"
                min="0"
                max="10000"
              />
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                <strong>Note:</strong> Percentage changes apply to <strong>future</strong> conversions only. Past
                commissions are snapshotted at the rate in effect when they were earned and never change.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
