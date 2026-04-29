import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { getCoinsLeaderboard, getWinRateLeaderboard } from '../../../api/leaderboards';
import { useAuth } from '../../../context/AuthContext';
import LeaderboardTable from '../../../components/admin/leaderboards/LeaderboardTable';

export default function LeaderboardsPreview() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coinsLeaderboard, setCoinsLeaderboard] = useState(null);
  const [winRateLeaderboard, setWinRateLeaderboard] = useState(null);

  const loadLeaderboards = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoading(true);

    try {
      const [coinsData, winRateData] = await Promise.all([
        getCoinsLeaderboard(token, 20),
        getWinRateLeaderboard(token, 20, 10)
      ]);
      
      setCoinsLeaderboard(coinsData);
      setWinRateLeaderboard(winRateData);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to load leaderboards';
      toast.error(message);
      console.error('Leaderboards fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();
  }, [token]);

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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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