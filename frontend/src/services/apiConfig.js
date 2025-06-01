import axios from 'axios';

// Define the base URL for API requests
export const API_BASE_URL = 'http://localhost:8000';
// export const isDev = process.env.NODE_ENV === 'development'
// export const API_BASE_URL = isDev ? process.env.REACT_APP_API_BASE_DEPLOY : process.env.REACT_APP_API_BASE_LOCAL;
// Function to get CSRF token from cookies
export const getCsrfToken = () => {
  const name = 'csrftoken';
  let cookieValue = '';
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  console.log('Retrieved CSRF token from cookies:', cookieValue ? 'Token found' : 'No token found');
  return cookieValue;
};

// Function to fetch a CSRF token if one doesn't exist
export const fetchCsrfToken = async () => {
  // First check if we already have a CSRF token
  let token = getCsrfToken();
  if (token) {
    console.log('Using existing CSRF token');
    return token;
  }
  
  // If not, make a request to a Django endpoint that will set the CSRF cookie
  console.log('Fetching new CSRF token...');
  try {
    await axios.get(`${API_BASE_URL}/`, {
      withCredentials: true
    });
    // Now get the token from the cookie
    token = getCsrfToken();
    console.log('New CSRF token fetched successfully:', token ? 'Token received' : 'No token received');
    return token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return '';
  }
};

// Create an axios instance with default configurations
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true // Include cookies for authentication (CSRF)
});

// Initialize CSRF token on module load
(async () => {
  try {
    console.log('Initializing CSRF token on app load');
    await fetchCsrfToken();
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
})();

// Add a request interceptor for handling tokens, etc.
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
    // Retrieve the auth token from localStorage (or wherever you store it after login)
    const authToken = localStorage.getItem('authToken'); // Assuming you store it as 'authToken'

    if (authToken) {
      config.headers['Authorization'] = `Token ${authToken}`;
      console.log('Added Auth Token to request headers');
    } else {
      // Optionally, handle cases where a protected route is accessed without a token
      // This might already be handled by your existing isAuthenticated check and redirect logic
      console.log('No Auth Token found in localStorage.');
    }
    
    // Always check authentication status first
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    
    // If the user is not authenticated and trying to access a protected endpoint, redirect to login
    if (!isAuthenticated && !config.url.includes('/login/') && !config.url.includes('/register/')) {
      console.log('User is not authenticated, you might be redirected to login');
    }
    
    // For all requests, try to get a fresh CSRF token
    let csrfToken = getCsrfToken();
    if (!csrfToken) {
      console.log('No CSRF token found, fetching a new one');
      try {
        csrfToken = await fetchCsrfToken();
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
    
    // Add CSRF token for all POST, PUT, PATCH, DELETE requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        console.log('Added CSRF token to request headers');
      } else {
        console.warn('No CSRF token available for this modifying request');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    // Handle common errors here (401, 403, etc.)
    if (error.response) {
      const { status, config } = error.response;
      
      console.error(`Error ${status} from ${config.url}:`, error.response.data);
      
      if (status === 401) {
        // Unauthorized - redirect to login
        console.error('Authentication failed (401), redirecting to login');
        // Clear authentication state to force a fresh login
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 302) {
        // Handle redirects - if redirect is to login page
        const location = error.response.headers.location;
        console.error('Got redirect (302) to:', location);
        
        if (location && (location.includes('/login') || location.includes('/api/login'))) {
          console.error('Redirect to login detected, authentication has failed');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (status === 403) {
        console.error('Forbidden: CSRF token may be missing or invalid');
        
        // Try to refresh the CSRF token on 403 errors
        try {
          await fetchCsrfToken();
          // If the request was a GET request, try again
          if (config.method.toLowerCase() === 'get') {
            return apiClient(config);
          }
        } catch (err) {
          console.error('Failed to refresh CSRF token:', err);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - no response received:', error.request);
    } else {
      // Something else happened
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 