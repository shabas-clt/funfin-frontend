import { useState, useEffect } from 'react';
import { Activity, Database, Key, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';

export default function LiveEngineDashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        api.get('/live-engine/health'),
        api.get('/live-engine/tokens/stats'),
      ]);
      setHealth(healthRes);
      setStats(statsRes);
    } catch (error) {
      toast.error('Failed to fetch live engine data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const healthyTokens = stats.filter((s) => s.is_healthy).length;
  const totalRequests = stats.reduce((sum, s) => sum + s.daily_requests, 0);
  const totalBandwidth = stats.reduce((sum, s) => sum + s.monthly_bandwidth_mb, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">
          Live Engine Dashboard
        </h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
          Monitor your data engine performance and token usage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Key}
          label="Active Tokens"
          value={`${healthyTokens} / ${stats.length}`}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Requests Today"
          value={totalRequests.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Bandwidth (Month)"
          value={`${totalBandwidth.toFixed(1)} MB`}
          color="purple"
        />
        <StatCard
          icon={Database}
          label="Database"
          value={health?.database?.timescaledb === 'connected' ? 'Connected' : 'Disconnected'}
          color={health?.database?.timescaledb === 'connected' ? 'green' : 'red'}
        />
      </div>

      {/* Collection Status */}
      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Collection Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CollectionStatus asset="Bitcoin" enabled={health?.collection?.bitcoin} />
            <CollectionStatus asset="Gold" enabled={health?.collection?.gold} />
            <CollectionStatus asset="Silver" enabled={health?.collection?.silver} />
          </div>
        </CardContent>
      </Card>

      {/* Token Usage */}
      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Token Usage
          </h2>
          <div className="space-y-4">
            {stats.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                No tokens configured
              </p>
            ) : (
              stats.map((token) => <TokenUsageBar key={token.token_id} token={token} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  };

  return (
    <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CollectionStatus = ({ asset, enabled }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-neutral-900 rounded-lg">
    <span className="font-medium text-slate-900 dark:text-white">{asset}</span>
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        enabled
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
          : 'bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-slate-400'
      }`}
    >
      {enabled ? 'Active' : 'Inactive'}
    </span>
  </div>
);

const TokenUsageBar = ({ token }) => {
  const getColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-slate-900 dark:text-white">{token.name}</span>
          {token.assigned_to && (
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              ({token.assigned_to})
            </span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            token.is_healthy
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          }`}
        >
          {token.is_healthy ? 'Healthy' : 'Limited'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
            <span>Hourly</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {token.hourly_requests}/{token.hourly_limit}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.hourly_percentage)}`}
              style={{ width: `${Math.min(token.hourly_percentage, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
            <span>Daily</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {token.daily_requests}/{token.daily_limit}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.daily_percentage)}`}
              style={{ width: `${Math.min(token.daily_percentage, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
            <span>Bandwidth</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {token.monthly_bandwidth_mb.toFixed(0)}/
              {token.monthly_bandwidth_limit_mb.toFixed(0)} MB
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.bandwidth_percentage)}`}
              style={{ width: `${Math.min(token.bandwidth_percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
