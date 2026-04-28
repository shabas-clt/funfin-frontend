import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'; // Client API

/**
 * Get all-time coins leaderboard
 * @param {string} token - Auth token
 * @param {number} limit - Number of entries (default 20)
 * @returns {Promise<{type, range, entries, total}>}
 */
export const getCoinsLeaderboard = async (token, limit = 20) => {
  const response = await axios.get(`${API_BASE}/api/v1/leaderboard/all-time/coins`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit }
  });
  return response.data;
};

/**
 * Get all-time win rate leaderboard
 * @param {string} token - Auth token
 * @param {number} limit - Number of entries (default 20)
 * @param {number} minPredictions - Minimum predictions required (default 10)
 * @returns {Promise<{type, range, entries, total}>}
 */
export const getWinRateLeaderboard = async (token, limit = 20, minPredictions = 10) => {
  const response = await axios.get(`${API_BASE}/api/v1/leaderboard/all-time/win-rate`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit, minPredictions }
  });
  return response.data;
};
