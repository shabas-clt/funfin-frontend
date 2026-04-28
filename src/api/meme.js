import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

/**
 * Get all memes with filters and pagination
 * @param {string} token - Auth token
 * @param {object} params - Query parameters (skip, limit, category, postingCategory, userId, sortBy)
 * @returns {Promise<{memes: Array, total: number}>}
 */
export const getMemes = async (token, params = {}) => {
  const response = await axios.get(`${API_BASE}/api/v1/admin/memes`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { skip: 0, limit: 20, ...params }
  });
  return response.data;
};

/**
 * Delete a meme by ID
 * @param {string} memeId - Meme ID
 * @param {string} token - Auth token
 * @returns {Promise<{message: string}>}
 */
export const deleteMeme = async (memeId, token) => {
  const response = await axios.delete(`${API_BASE}/api/v1/admin/memes/${memeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Get all posting categories
 * @param {string} token - Auth token
 * @returns {Promise<Array>}
 */
export const getPostingCategories = async (token) => {
  const response = await axios.get(`${API_BASE}/api/v1/admin/memes/posting-categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Create a new posting category
 * @param {object} data - Category data (code, name, sortOrder)
 * @param {string} token - Auth token
 * @returns {Promise<object>}
 */
export const createPostingCategory = async (data, token) => {
  const response = await axios.post(`${API_BASE}/api/v1/admin/memes/posting-categories`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Delete a posting category
 * @param {string} id - Category ID
 * @param {string} token - Auth token
 * @returns {Promise<{message: string}>}
 */
export const deletePostingCategory = async (id, token) => {
  const response = await axios.delete(`${API_BASE}/api/v1/admin/memes/posting-categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Get all content categories
 * @param {string} token - Auth token
 * @returns {Promise<Array>}
 */
export const getContentCategories = async (token) => {
  const response = await axios.get(`${API_BASE}/api/v1/admin/memes/content-categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Create a new content category
 * @param {object} data - Category data (code, name, sortOrder)
 * @param {string} token - Auth token
 * @returns {Promise<object>}
 */
export const createContentCategory = async (data, token) => {
  const response = await axios.post(`${API_BASE}/api/v1/admin/memes/content-categories`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * Delete a content category
 * @param {string} id - Category ID
 * @param {string} token - Auth token
 * @returns {Promise<{message: string}>}
 */
export const deleteContentCategory = async (id, token) => {
  const response = await axios.delete(`${API_BASE}/api/v1/admin/memes/content-categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
