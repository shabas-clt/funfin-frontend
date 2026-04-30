import { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { simulationApi, STOCK_LIST, TRADE_STATUS } from '../../../api/simulationApi';

const SimulationTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    stock: '',
    user_id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const loadTrades = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        skip: 0,
        limit: 100,
      };
      if (filters.status) params.status = filters.status;
      if (filters.stock) params.stock = filters.stock;
      if (filters.user_id) params.user_id = filters.user_id;

      const data = await simulationApi.getTrades(params);
      setTrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading trades:', err);
      setError(typeof err === 'string' ? err : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setFilters((prev) => ({ ...prev, user_id: searchTerm.trim() }));
    } else {
      setFilters((prev) => ({ ...prev, user_id: '' }));
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', stock: '', user_id: '' });
    setSearchTerm('');
  };

  const filteredTrades = trades;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Simulation Trades
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor all simulation trading activity
            </p>
          </div>
          <button
            onClick={loadTrades}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search by User ID */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by User ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-slate-500"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value={TRADE_STATUS.OPEN}>Open</option>
            <option value={TRADE_STATUS.CLOSED}>Closed</option>
          </select>

          {/* Stock Filter */}
          <select
            value={filters.stock}
            onChange={(e) => handleFilterChange('stock', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <option value="">All Stocks</option>
            {STOCK_LIST.map((stock) => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700"
          >
            <Filter className="h-4 w-4" />
            Clear Filters
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Trades Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Trade ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  User ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Leverage
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Entry Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Exit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  P&L
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Opened At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading trades...
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No trades found
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const pnl = trade.pnl || 0;
                  const pnlColor = pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  const PnlIcon = pnl >= 0 ? TrendingUp : TrendingDown;

                  return (
                    <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                        {trade.id?.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                        {trade.user_id?.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {trade.stock_symbol}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            trade.trade_type === 'buy'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {trade.trade_type === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(trade.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        X{trade.leverage}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        ${formatCurrency(trade.entry_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                        {trade.exit_price ? `$${formatCurrency(trade.exit_price)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${pnlColor}`}>
                        {trade.status === TRADE_STATUS.CLOSED ? (
                          <span className="inline-flex items-center gap-1">
                            <PnlIcon className="h-3 w-3" />
                            {formatCurrency(Math.abs(pnl))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            trade.status === TRADE_STATUS.OPEN
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                          }`}
                        >
                          {trade.status === TRADE_STATUS.OPEN && <Clock className="h-3 w-3" />}
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(trade.opened_at)}
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

export default SimulationTrades;
