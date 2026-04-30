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
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return value.toFixed(2);
  };

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
            title="Total Trades"
            value={formatNumber(stats.total_trades)}
            icon={Activity}
            color="bg-blue-500"
            subtitle={`${formatNumber(stats.open_trades)} open, ${formatNumber(stats.closed_trades)} closed`}
          />
          <StatCard
            title="Active Users"
            value={formatNumber(stats.active_users)}
            icon={Users}
            color="bg-green-500"
            subtitle="Users with open trades"
          />
          <StatCard
            title="Total Volume"
            value={formatCurrency(stats.total_volume)}
            icon={DollarSign}
            color="bg-purple-500"
            subtitle="FunCoins traded"
          />
          <StatCard
            title="Net P&L"
            value={formatCurrency(stats.total_pnl)}
            icon={stats.total_pnl >= 0 ? TrendingUp : TrendingDown}
            color={stats.total_pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
            subtitle="Total profit/loss"
          />
        </div>
      )}

      {/* Stock Performance */}
      {stats && stats.stock_stats && stats.stock_stats.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Stock Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Total Trades
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Open Trades
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Net P&L
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                {stats.stock_stats.map((stock) => {
                  const pnl = stock.total_pnl || 0;
                  const pnlColor = pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                  return (
                    <tr key={stock.stock_symbol} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {stock.stock_symbol}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {formatNumber(stock.total_trades)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        {formatNumber(stock.open_trades)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {formatCurrency(stock.total_volume)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${pnlColor}`}>
                        {formatCurrency(pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                  User ID
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
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No traders yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((trader, index) => {
                  const pnl = trader.total_pnl || 0;
                  const pnlColor = pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  const winRate = trader.total_trades > 0 ? (trader.winning_trades / trader.total_trades) * 100 : 0;

                  return (
                    <tr key={trader.user_id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : index === 1
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-slate-50 text-slate-600 dark:bg-neutral-900 dark:text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                        {trader.user_id?.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {formatNumber(trader.total_trades)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {winRate.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${pnlColor}`}>
                        {formatCurrency(pnl)}
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
