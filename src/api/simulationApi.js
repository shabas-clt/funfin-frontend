import { api } from './axios';

// Admin Simulation API endpoints
export const simulationApi = {
  // Get all trades with filters
  getTrades: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.stock) queryParams.append('stock', params.stock);
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.skip !== undefined) queryParams.append('skip', params.skip);
    if (params.limit !== undefined) queryParams.append('limit', params.limit);
    
    const url = `/admin/simulation/trades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },

  // Get system statistics
  getStats: async () => {
    return api.get('/admin/simulation/stats');
  },

  // Get leaderboard
  getLeaderboard: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit !== undefined) queryParams.append('limit', params.limit);
    
    const url = `/admin/simulation/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
};

// Stock list (12 US stocks)
export const STOCK_LIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corp.' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  { symbol: 'BA', name: 'Boeing Co.' },
];

// Leverage options
export const LEVERAGE_OPTIONS = [
  { value: 1, label: 'X1' },
  { value: 5, label: 'X5' },
  { value: 10, label: 'X10' },
  { value: 20, label: 'X20' },
  { value: 100, label: 'X100' },
];

// Trade status
export const TRADE_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
};

// Trade types
export const TRADE_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
};
