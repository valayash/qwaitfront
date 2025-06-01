import apiClient from './apiConfig';

// Function to log in a user
const login = async (email, password) => {
  try {
    console.log('Attempting to log in user:', email);
    // Backend now expects JSON and returns token directly
    const response = await apiClient.post('/api/auth/login/', { // Updated URL
      email: email,
      password: password
    }); // Removed Content-Type header, Axios default is good for JSON
    
    if (response.data && response.data.token) { // Check for token
      console.log('Login successful, storing authentication data');
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', response.data.token); // Store the auth token
      localStorage.setItem('user', JSON.stringify({ // Store user info
        id: response.data.user?.id,
        email: response.data.user?.email,
        restaurant_id: response.data.restaurant_id,
        restaurant_name: response.data.restaurant_name,
        // lastLogin: new Date().toISOString() // lastLogin can be set if needed
      }));
      
      console.log('Successfully stored authentication data');
      
      // Optional: Make a test request to a known authenticated endpoint
      // try {
      //   const testResponse = await apiClient.get('/api/auth/some_protected_route/'); // Update test route
      //   console.log('Authentication verification successful:', testResponse.status);
      // } catch (verifyError) {
      //   console.error('Authentication verification failed:', verifyError);
      // }
      
      return {
        success: true,
        data: response.data // Return all data from backend
      };
    } else {
      console.error('Login failed: Token not found in response', response.data);
      return {
        success: false,
        message: response.data?.message || response.data?.error || 'Login failed: Unexpected response from server'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.response?.data?.detail || // DRF often uses 'detail' for auth errors
                         'Failed to log in. Please check your credentials.';
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Function to log out a user
const logout = async () => {
  try {
    // Call the logout endpoint
    await apiClient.post('/api/auth/logout/'); // Updated URL
    
    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Remove the auth token
    
    console.log('User logged out and local storage cleared.');
    return {
      success: true
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear localStorage as a fallback
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.detail || 'Failed to log out properly.'
    };
  }
};

// Function to check if a user is authenticated
const isAuthenticated = () => {
  const authToken = localStorage.getItem('authToken');
  const authStatus = localStorage.getItem('isAuthenticated') === 'true' && !!authToken; // Check for token too
  const user = getCurrentUser();
  console.log('Authentication check:', { 
    isAuthenticated: authStatus, 
    hasAuthToken: !!authToken,
    hasUserData: user !== null,
    user: user ? `${user.email}` : 'No user data' // Simplified user display
  });
  return authStatus;
};

// Function to get current user
const getCurrentUser = () => {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
      localStorage.removeItem('user'); // Clear corrupted user data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authToken');
      return null;
    }
  }
  return null;
};

// Function to initialize authentication state (simplified, can be enhanced)
const initializeAuth = () => { // Removed async as test request is commented out for now
  console.log('Initializing authentication state');
  const authStatus = isAuthenticated();
  
  if (authStatus) {
    console.log('User appears to be authenticated based on localStorage.');
    // More robust validation (e.g., token expiry check or API call) can be added here if needed
  } else {
    console.log('User is not authenticated.');
  }
  return authStatus;
};

// Function to register a new user
const register = async (userData) => {
  try {
    console.log('Registering new user with data:', userData);
    // Backend expects JSON
    const response = await apiClient.post('/api/auth/register/', { // Updated URL
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name || '', // Add if your form collects these
      last_name: userData.last_name || '',
      restaurant_name: userData.restaurant_name
    });
    
    if (response.data && response.data.token) { // Backend now returns token on successful registration
      console.log('Registration successful, storing auth token:', response.data);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        email: response.data.email,
        restaurant_id: response.data.restaurant_id,
        restaurant_name: response.data.restaurant_name,
      }));
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('Registration failed: Token not found or other issue.', response.data);
      return {
        success: false,
        message: response.data?.error || response.data?.detail || 'Failed to register. Please try again.'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Extract DRF validation errors if available
    let errorMessage = error.response?.data?.detail || 'Failed to register. Please try again.';
    if (error.response?.data && typeof error.response.data === 'object') {
        const errors = Object.entries(error.response.data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
        if (errors) errorMessage = errors;
    }
    return {
      success: false,
      message: errorMessage
    };
  }
};

export {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  register,
  initializeAuth
}; 