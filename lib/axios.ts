import axios from 'axios';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Prevent axios from exposing sensitive headers
  withCredentials: true,
});

// Add a request interceptor to handle auth
axiosInstance.interceptors.request.use(
  (config) => {
    // Remove any sensitive headers that might be exposed
    if (config.headers) {
      delete config.headers['Authorization'];
      delete config.headers['Cookie'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors without exposing sensitive information
    if (error.response) {
      // Remove sensitive information from error response
      delete error.response.headers['set-cookie'];
      delete error.response.headers['authorization'];
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 