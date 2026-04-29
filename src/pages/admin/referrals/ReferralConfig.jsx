import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';
import { getReferralConfig, updateReferralConfig } from '../../../api/referral';
import { useAuth } from '../../../context/AuthContext';
import ConfigForm from '../../../components/admin/referrals/ConfigForm';

export default function ReferralConfig() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  const loadConfig = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const data = await getReferralConfig(token);
      setConfig(data);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to load config';
      toast.error(message);
      console.error('Config fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [token]);

  const handleSave = async (formData) => {
    if (!token) return;

    try {
      const updated = await updateReferralConfig(formData, token);
      setConfig(updated);
      toast.success('Configuration updated successfully');
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to update config';
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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