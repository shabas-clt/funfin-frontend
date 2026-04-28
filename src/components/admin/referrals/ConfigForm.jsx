import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Save } from 'lucide-react';
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
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">System Status</p>
            <p className="font-medium">
              {config.isEnabled ? (
                <span className="text-green-600">Enabled</span>
              ) : (
                <span className="text-red-600">Disabled</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Reward Amount</p>
            <p className="font-medium">{config.rewardAmount} coins</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Last Updated</p>
            <p className="font-medium">
              {new Date(config.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Update Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isEnabled')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable Referral System
              </span>
            </label>
            {errors.isEnabled && (
              <p className="mt-1 text-sm text-red-600">{errors.isEnabled.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reward Amount (coins) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('rewardAmount')}
              min="0"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.rewardAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.rewardAmount.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Both referrer and referee will receive this amount (0-10,000 coins)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Rewards are awarded after the referee verifies their email address.
              Both the referrer and referee receive the same reward amount.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}