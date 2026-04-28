import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

/**
 * Get referral system configuration
 * @param {string} token - Auth token
 * @returns {Promise<{isEnabled: boolean, rewardAmount: number, updatedAt: string}>}
 */
export const getReferralConfig = async (token) => {
  const response = await axios.get(`${API_BASE}/api/v1/admin/referral/config`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Update referral system configuration
 * @param {object} data - Config data (isEnabled, rewardAmount)
 * @param {string} token - Auth token
 * @returns {Promise<{isEnabled: boolean, rewardAmount: number, updatedAt: string}>}
 */
export const updateReferralConfig = async (data, token) => {
  const response = await axios.put(`${API_BASE}/api/v1/admin/referral/config`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Get referral analytics
 * @param {string} token - Auth token
 * @returns {Promise<{totalReferrals, successfulReferrals, pendingReferrals, totalCoinsAwarded, averageReferralsPerUser}>}
 */
export const getReferralAnalytics = async (token) => {
  const response = await axios.get(`${API_BASE}/api/v1/admin/referral/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
