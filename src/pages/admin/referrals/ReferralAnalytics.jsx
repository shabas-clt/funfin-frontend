import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { useAuth } from '../../../context/AuthContext';
import StatsCards from '../../../components/admin/referrals/StatsCards';
import StatusPieChart from '../../../components/admin/referrals/StatusPieChart';

export default function ReferralAnalytics() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (!isRefresh) setLoading(true);

    try {
      const data = await api.get('/admin/referral/analytics');
      setAnalytics(data);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to load analytics';
      toast.error(message);
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [isAuthenticated]);

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Referral Analytics</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">View referral system performance and statistics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-3.5 w-28" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          <StatsCards analytics={analytics} />
          <StatusPieChart analytics={analytics} />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Failed to load analytics</p>
        </div>
      )}
    </div>
  );
}
