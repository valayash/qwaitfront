import apiClient from './apiConfig';

// Function to log in a user
const login = async (email, password) => {
  try {
    console.log('Attempting to log in user:', email);
    
    const response = await apiClient.post('/login/', {
      email: email,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // The response from the Django backend should now be JSON
    if (response.data && response.data.success) {
      console.log('Login successful, storing authentication data');
      
      // Store auth data in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        email: email,
        name: response.data.name || email,
        token: response.data.token || '',
        lastLogin: new Date().toISOString()
      }));
      
      console.log('Successfully stored authentication data');
      
      // Make a test request to verify authentication works
      try {
        const testResponse = await apiClient.get('/dashboard/');
        console.log('Authentication verification successful:', testResponse.status);
      } catch (verifyError) {
        console.error('Authentication verification failed:', verifyError);
        // Even if verification fails, we'll still consider login successful
        // as the initial login request succeeded
      }
      
      return {
        success: true,
        data: response.data
      };
    } else {
      // Unexpected response format
      console.error('Login failed: Unexpected response format', response.data);
      return {
        success: false,
        message: response.data?.message || 'Unexpected response from server'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
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
    const response = await apiClient.post('/logout/');
    
    // Clear localStorage regardless of success
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to log out properly.'
    };
  }
};

// Function to check if a user is authenticated
const isAuthenticated = () => {
  const authStatus = localStorage.getItem('isAuthenticated') === 'true';
  const user = getCurrentUser();
  console.log('Authentication check:', { 
    isAuthenticated: authStatus, 
    hasUserData: user !== null,
    user: user ? `${user.name} (${user.email})` : 'No user data'
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
      return null;
    }
  }
  return null;
};

// Function to initialize authentication state
const initializeAuth = async () => {
  console.log('Initializing authentication state');
  const authStatus = isAuthenticated();
  
  if (authStatus) {
    console.log('User is already authenticated, verifying session validity');
    
    // Check when the user last logged in
    const user = getCurrentUser();
    if (user && user.lastLogin) {
      const lastLogin = new Date(user.lastLogin);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
      
      console.log(`Hours since last login: ${hoursSinceLogin.toFixed(2)}`);
      
      if (hoursSinceLogin > 24) {
        // If more than 24 hours have passed, force re-authentication
        console.log('Login session expired (>24 hours), clearing auth state');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        return false;
      }
      
      // Verify that our session is still valid by making a test request
      try {
        console.log('Validating session with test request');
        const response = await apiClient.get('/dashboard/');
        console.log('Session validation successful:', response.status);
        return true;
      } catch (error) {
        console.error('Session validation failed:', error);
        if (error.response?.status === 302 || error.response?.status === 401) {
          console.log('Clearing auth state due to redirect or unauthorized response');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          return false;
        }
      }
    } else {
      console.warn('User data invalid or missing lastLogin, clearing auth state');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      return false;
    }
  } else {
    console.log('User is not authenticated, will need to log in');
  }
  
  return authStatus;
};

// Function to register a new user
const register = async (userData) => {
  try {
    console.log('Registering new user with data:', userData);
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('confirm_password', userData.confirm_password);
    formData.append('restaurant_name', userData.restaurant_name);
    
    const response = await apiClient.post('/register/', formData);
    
    if (response.data && response.data.success) {
      console.log('Registration successful:', response.data);
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('Registration failed:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Failed to register. Please try again.'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to register. Please try again.'
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