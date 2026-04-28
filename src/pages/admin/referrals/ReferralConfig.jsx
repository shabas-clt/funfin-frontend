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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Referral System Configuration</h1>
        <p className="text-gray-600 mt-1">Manage referral system settings and rewards</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : config ? (
        <ConfigForm config={config} onSave={handleSave} />
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Failed to load configuration</p>
        </div>
      )}
    </div>
  );
}