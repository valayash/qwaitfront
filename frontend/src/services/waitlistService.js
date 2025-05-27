import apiClient from './apiConfig';

// Function to fetch waitlist data from API
const fetchWaitlist = async () => {
  try {
    console.log('Fetching waitlist data...');
    const response = await apiClient.get('/waitlist/');
    console.log('Waitlist API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    throw error;
  }
};

// Function to fetch QR code for joining the queue
const fetchQRCode = async () => {
  try {
    console.log('Fetching QR code data...');
    const response = await apiClient.get('/qrcode/');
    console.log('QR code API response:', response.data);
    
    // Validate the response contains expected data
    if (!response.data.qr_code || !response.data.join_url) {
      console.error('QR code response missing expected fields:', response.data);
      return {
        qr_code: '',
        join_url: ''
      };
    }
    
    return {
      qr_code: response.data.qr_code,
      join_url: response.data.join_url
    };
  } catch (error) {
    console.error('Error fetching QR code:', error);
    // Return empty values to prevent UI errors
    return {
      qr_code: '',
      join_url: ''
    };
  }
};

// Function to update entry status (waiting, notified, served, cancelled)
const updateEntryStatus = async (entryId, status) => {
  try {
    const response = await apiClient.post(`/waitlist/entry/${entryId}/status/`, 
      { status: status },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating entry status:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update status' 
    };
  }
};

// Function to remove entry from waitlist
const removeEntry = async (entryId) => {
  try {
    const response = await apiClient.post(`/waitlist/entry/${entryId}/remove/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error removing entry:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to remove entry' 
    };
  }
};

// Function to refresh the queue
const refreshQueue = async () => {
  try {
    const response = await apiClient.post('/waitlist/refresh/');
    return { 
      success: true, 
      entries: response.data.entries,
      count: response.data.count
    };
  } catch (error) {
    console.error('Error refreshing queue:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to refresh queue' 
    };
  }
};

// Function to add a party to the waitlist
const addParty = async (partyData) => {
  console.log('Adding party with data:', partyData);
  try {
    // Use the same endpoint as waitlist data, but as a POST request
    const response = await apiClient.post('/waitlist/add-party/', partyData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Log the response for debugging
    console.log('Add party API response:', response.data);
    
    if (!response.data.success) {
      console.error('Add party API returned success=false:', response.data);
      return {
        success: false,
        message: response.data.message || 'Failed to add party',
        data: response.data
      };
    }
    
    console.log('Successfully added party, forcing a waitlist refresh');
    
    try {
      // Force a manual refresh in case socket update doesn't work
      await fetchWaitlist();
    } catch (refreshError) {
      console.warn('Non-critical error refreshing waitlist after adding party:', refreshError);
    }
    
    return {
      success: true,
      message: response.data.message || 'Party added successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error adding party:', error);
    console.error('Error details:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to add party' 
    };
  }
};

// Function to edit an entry in the waitlist
const editEntry = async (entryId, updatedData) => {
  try {
    const response = await apiClient.put(`/waitlist/entry/${entryId}/edit/`, updatedData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error editing entry:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update entry' 
    };
  }
};

// Function to update column settings
const updateColumnSettings = async (columns) => {
  try {
    const response = await apiClient.post('/waitlist/update-columns/', { columns });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating column settings:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update column settings' 
    };
  }
};

// Function to get waitlist entries
const getWaitlist = async () => {
  try {
    console.log('Getting waitlist entries...');
    const response = await apiClient.get('/waitlist/');
    console.log('Waitlist entries response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    throw error;
  }
};

// Function to add a customer to waitlist
const addToWaitlist = async (customerData) => {
  try {
    const formData = new FormData();
    formData.append('name', customerData.name);
    formData.append('phone', customerData.phone);
    formData.append('party_size', customerData.party_size);
    formData.append('quoted_time', customerData.quoted_time);
    
    if (customerData.email) {
      formData.append('email', customerData.email);
    }
    
    if (customerData.notes) {
      formData.append('notes', customerData.notes);
    }
    
    const response = await apiClient.post('/waitlist/add-party/', formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to add to waitlist' 
    };
  }
};

// Function to edit a waitlist entry
const editWaitlistEntry = async (entryId, updatedData) => {
  try {
    const formData = new FormData();
    
    Object.keys(updatedData).forEach(key => {
      formData.append(key, updatedData[key]);
    });
    
    const response = await apiClient.post(`/waitlist/entry/${entryId}/edit/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error editing waitlist entry:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to edit waitlist entry' 
    };
  }
};

// Function to send SMS notification
const sendSmsNotification = async (entryId) => {
  try {
    const response = await apiClient.post(`/waitlist/notify/${entryId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to send SMS notification' 
    };
  }
};

// Function to seat a party
const seatParty = async (entryId, tableNumber) => {
  try {
    const formData = new FormData();
    formData.append('table_number', tableNumber);
    
    const response = await apiClient.post(`/waitlist/entry/${entryId}/serve/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error seating party:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to seat party' 
    };
  }
};

// Function to get waitlist entry by ID
const getWaitlistEntry = async (entryId) => {
  try {
    const response = await apiClient.get(`/waitlist/entry/${entryId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting waitlist entry:', error);
    throw error;
  }
};

// Function to mark as no show
const markNoShow = async (entryId) => {
  try {
    const response = await apiClient.post(`/waitlist/entry/${entryId}/status/`, {
      status: 'NO_SHOW'
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error marking as no show:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to mark as no show' 
    };
  }
};

// Function to get tables configuration
const getTablesConfig = async () => {
  try {
    const response = await apiClient.get('/settings/tables/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting tables config:', error);
    throw error;
  }
};

// Function to get estimated wait time
const getEstimatedWaitTime = async (partySize) => {
  try {
    const response = await apiClient.get(`/waitlist/estimate-wait/?party_size=${partySize}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting estimated wait time:', error);
    throw error;
  }
};

export {
  fetchWaitlist,
  fetchQRCode,
  updateEntryStatus,
  removeEntry,
  refreshQueue,
  addParty,
  editEntry,
  updateColumnSettings,
  getWaitlist,
  addToWaitlist,
  editWaitlistEntry,
  sendSmsNotification,
  seatParty,
  getWaitlistEntry,
  markNoShow,
  getTablesConfig,
  getEstimatedWaitTime
}; 