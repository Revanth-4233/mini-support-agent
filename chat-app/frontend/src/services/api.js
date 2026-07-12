import axios from 'axios';
import { API_BASE_URL } from '../constants';

/**
 * Axios instance configured with the backend API base URL.
 * All API calls go through this instance for consistent config.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all chat messages (sorted oldest first).
 * @returns {Promise<Array>} Array of message objects
 */
export const fetchMessages = async () => {
  try {
    const response = await apiClient.get('/messages');
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch messages';
    throw new Error(message);
  }
};

/**
 * Send a new chat message.
 * @param {string} name - Sender's name
 * @param {string} message - Message content
 * @returns {Promise<Object>} Response with success status and saved message
 */
export const sendMessage = async (name, message) => {
  try {
    const response = await apiClient.post('/messages', { name, message });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Failed to send message';
    throw new Error(errorMessage);
  }
};

export default apiClient;
