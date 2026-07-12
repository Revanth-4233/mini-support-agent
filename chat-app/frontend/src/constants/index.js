/**
 * Application constants.
 * Update these values to match your backend deployment.
 */

// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your machine's LAN IP (e.g., 192.168.1.x)
// For iOS simulator, localhost works fine
const getBaseUrl = () => {
  // Default to localhost — works for web and iOS simulator
  return 'http://localhost:5000';
};

export const API_BASE_URL = `${getBaseUrl()}/api`;
export const SOCKET_URL = getBaseUrl();

// App metadata
export const APP_NAME = 'ChatApp';
export const MESSAGE_LIMIT = 100;
