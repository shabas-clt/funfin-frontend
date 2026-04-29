import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { clientApi } from '@/api/axios';
import { useAuth } from '../../../context/AuthContext';
import LeaderboardTable from '../../../components/admin/leaderboards/LeaderboardTable';

export default function LeaderboardsPreview() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coinsLeaderboard, setCoinsLeaderboard] = useState(null);
  const [winRateLeaderboard, setWinRateLeaderboard] = useState(null);

  const loadLeaderboards = async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (!isRefresh) setLoading(true);

    try {
      // Note: These endpoints are on the client API but now accept both user and admin tokens
      const [coinsData, winRateData] = await Promise.all([
        clientApi.get('/leaderboard/all-time/coins', { params: { limit: 20 } }),
        clientApi.get('/leaderboard/all-time/win-rate', { params: { limit: 20, minPredictions: 10 } })
      ]);
      
      setCoinsLeaderboard({ ...coinsData, type: 'coins' });
      setWinRateLeaderboard({ ...winRateData, type: 'win-rate' });
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to load leaderboards';
      toast.error(message);
      console.error('Leaderboards fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();
  }, [isAuthenticated]);

  const handleRefresh = () => {
    loadLeaderboards(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Leaderboards Preview</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">View all-time leaderboards for coins and win rates</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-24 h-6" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaderboardTable 
            leaderboard={coinsLeaderboard} 
            title="All-Time Coins Earned" 
          />
          <LeaderboardTable 
            leaderboard={winRateLeaderboard} 
            title="All-Time Win Rate" 
          />
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Calculation Methods</h3>
        <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
          <p><strong>Coins Leaderboard:</strong> Total coins earned across all activities</p>
          <p><strong>Win Rate Leaderboard:</strong> (Wins ÷ Total Predictions) × 100 (minimum 10 predictions required)</p>
        </div>
      </div>
    </div>
  );
}
