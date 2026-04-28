import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { getReferralAnalytics } from '../../../api/referral';
import { useAuth } from '../../../context/AuthContext';
import StatsCards from '../../../components/admin/referrals/StatsCards';
import StatusPieChart from '../../../components/admin/referrals/StatusPieChart';

export default function ReferralAnalytics() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoading(true);

    try {
      const data = await getReferralAnalytics(token);
      setAnalytics(data);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to load analytics';
      toast.error(message);
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Referral Analytics</h1>
          <p className="text-gray-600 mt-1">View referral system performance and statistics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          <StatsCards analytics={analytics} />
          <StatusPieChart analytics={analytics} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Failed to load analytics</p>
        </div>
      )}
    </div>
  );
}