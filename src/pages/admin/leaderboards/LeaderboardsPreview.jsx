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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Leaderboards Preview</h1>
          <p className="text-gray-600 mt-1">View all-time leaderboards for coins and win rates</p>
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

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Calculation Methods</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Coins Leaderboard:</strong> Total coins earned across all activities</p>
          <p><strong>Win Rate Leaderboard:</strong> (Wins ÷ Total Predictions) × 100 (minimum 10 predictions required)</p>
        </div>
      </div>
    </div>
  );
}