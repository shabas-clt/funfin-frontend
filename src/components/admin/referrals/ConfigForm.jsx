import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Save, AlertCircle } from 'lucide-react';
import { referralConfigSchema } from '../../../lib/validators/referralValidators';

export default function ConfigForm({ config, onSave }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(referralConfigSchema),
    defaultValues: {
      isEnabled: config.isEnabled,
      rewardAmount: config.rewardAmount
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
    <div className="space-y-5">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Current Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">System Status</p>
            <p className="font-medium mt-1">
              {config.isEnabled ? (
                <span className="text-emerald-600 dark:text-emerald-400">Enabled</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">Disabled</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Reward Amount</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">{config.rewardAmount} coins</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500 dark:text-slate-400">Last Updated</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">
              {new Date(config.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Update Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isEnabled')}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-slate-300 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enable Referral System
              </span>
            </label>
            {errors.isEnabled && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.isEnabled.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Reward Amount (coins) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register('rewardAmount')}
              min="0"
              max="10000"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {errors.rewardAmount && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.rewardAmount.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Both referrer and referee will receive this amount (0-10,000 coins)
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                <strong>Note:</strong> Rewards are awarded after the referee verifies their email address.
                Both the referrer and referee receive the same reward amount.
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
