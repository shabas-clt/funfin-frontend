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

// US Stock list (12 stocks)
export const US_STOCK_LIST = [
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'US' },
  { symbol: 'META', name: 'Meta Platforms Inc.', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'US' },
  { symbol: 'NFLX', name: 'Netflix Inc.', market: 'US' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'US' },
  { symbol: 'INTC', name: 'Intel Corp.', market: 'US' },
  { symbol: 'DIS', name: 'Walt Disney Co.', market: 'US' },
  { symbol: 'BA', name: 'Boeing Co.', market: 'US' },
];

// Indian Stock list (10 stocks)
export const INDIAN_STOCK_LIST = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', market: 'India' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', market: 'India' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', market: 'India' },
  { symbol: 'INFY', name: 'Infosys', market: 'India' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', market: 'India' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', market: 'India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', market: 'India' },
  { symbol: 'ITC', name: 'ITC Limited', market: 'India' },
  { symbol: 'SBIN', name: 'State Bank of India', market: 'India' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', market: 'India' },
];

// UK Stock list (10 stocks)
export const UK_STOCK_LIST = [
  { symbol: 'HSBA', name: 'HSBC Holdings', market: 'UK' },
  { symbol: 'BP', name: 'BP plc', market: 'UK' },
  { symbol: 'SHEL', name: 'Shell plc', market: 'UK' },
  { symbol: 'VOD', name: 'Vodafone Group', market: 'UK' },
  { symbol: 'AZN', name: 'AstraZeneca', market: 'UK' },
  { symbol: 'ULVR', name: 'Unilever', market: 'UK' },
  { symbol: 'GSK', name: 'GSK plc', market: 'UK' },
  { symbol: 'DGE', name: 'Diageo', market: 'UK' },
  { symbol: 'BARC', name: 'Barclays', market: 'UK' },
  { symbol: 'LLOY', name: 'Lloyds Banking Group', market: 'UK' },
];

// Combined stock list (for backward compatibility)
export const STOCK_LIST = US_STOCK_LIST;

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
