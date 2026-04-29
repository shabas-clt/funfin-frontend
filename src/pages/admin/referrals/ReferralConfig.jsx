import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useAuth } from '../../../context/AuthContext';
import ConfigForm from '../../../components/admin/referrals/ConfigForm';

export default function ReferralConfig() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  const loadConfig = async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    try {
      const data = await api.get('/admin/referral/config');
      setConfig(data);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to load config';
      toast.error(message);
      console.error('Config fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [isAuthenticated]);

  const handleSave = async (formData) => {
    try {
      const updated = await api.put('/admin/referral/config', formData);
      setConfig(updated);
      toast.success('Configuration updated successfully');
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to update config';
      toast.error(message);
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Referral System Configuration</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage referral system settings and rewards</p>
        </div>
      </div>

      {loading ? (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      ) : config ? (
        <ConfigForm config={config} onSave={handleSave} />
      ) : (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Failed to load configuration</p>
        </div>
      )}
    </div>
  );
}
