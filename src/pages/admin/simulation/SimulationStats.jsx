import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Users, DollarSign, Activity, Trophy } from 'lucide-react';
import { simulationApi } from '../../../api/simulationApi';

const SimulationStats = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, leaderboardData] = await Promise.all([
        simulationApi.getStats(),
        simulationApi.getLeaderboard({ limit: 10 }),
      ]);
      setStats(statsData);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(typeof err === 'string' ? err : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString();
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Simulation Trading Statistics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Overview of simulation trading activity and performance
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Trades"
            value={formatNumber(stats.totalActiveTrades)}
            icon={Activity}
            color="bg-blue-500"
            subtitle="Currently open positions"
          />
          <StatCard
            title="Active Users"
            value={formatNumber(stats.totalUsers)}
            icon={Users}
            color="bg-green-500"
            subtitle="Users trading"
          />
          <StatCard
            title="Total Volume"
            value={`${formatNumber(stats.totalVolume)} coins`}
            icon={DollarSign}
            color="bg-purple-500"
            subtitle="FunCoins in open trades"
          />
          <StatCard
            title="Net P&L"
            value={`${stats.totalProfitLoss >= 0 ? '+' : ''}${formatNumber(stats.totalProfitLoss)} coins`}
            icon={stats.totalProfitLoss >= 0 ? TrendingUp : TrendingDown}
            color={stats.totalProfitLoss >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
            subtitle="Total profit/loss"
          />
        </div>
      )}

      {/* Most Traded Stock */}
      {stats && stats.mostTradedStock && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            Most Traded Stock
          </h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.mostTradedStock}
          </p>
        </div>
      )}

      {/* Top Traders Leaderboard */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Top Traders (This Week)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Country
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total Trades
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Win Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No traders yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((trader) => {
                  const pnl = trader.totalProfitLoss || 0;
                  const pnlColor = pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                  return (
                    <tr key={trader.userId} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                            trader.rank === 1
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : trader.rank === 2
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : trader.rank === 3
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-slate-50 text-slate-600 dark:bg-neutral-900 dark:text-slate-400'
                          }`}
                        >
                          {trader.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {trader.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {trader.country}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {formatNumber(trader.totalTrades)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {trader.winRate.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${pnlColor}`}>
                        {pnl >= 0 ? '+' : ''}{formatNumber(pnl)} coins
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimulationStats;
