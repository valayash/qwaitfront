import apiClient from './apiConfig';

// Function to fetch comprehensive waitlist data (entries, QR, config)
const getWaitlistData = async () => {
  try {
    console.log('Fetching comprehensive waitlist data...');
    // Uses the custom action on the ViewSet that provides formatted entries, QR, etc.
    const response = await apiClient.get('/api/waitlist/entries/data_with_qr/');
    console.log('Waitlist data_with_qr response:', response.data);
    return response.data; // Includes restaurant, queue_entries, queue_count, qr_code, join_url
  } catch (error) {
    console.error('Error fetching comprehensive waitlist data:', error);
    throw error;
  }
};

// Function to fetch only QR code if needed separately
const fetchQRCodeOnly = async () => {
  try {
    console.log('Fetching QR code data only...');
    const response = await apiClient.get('/api/waitlist/qrcode/');
    console.log('QR code API response:', response.data);
    return response.data; // Should return { qr_code: 'data:image/png;base64,...', join_url: '...' }
  } catch (error) {
    console.error('Error fetching QR code only:', error);
    return { qr_code: '', join_url: '' };
  }
};

// Function to update entry status
const updateEntryStatus = async (entryId, newStatus) => {
  try {
    const response = await apiClient.post(`/api/waitlist/entries/${entryId}/set_status/`, 
      { status: newStatus } // Backend expects { "status": "NEW_STATUS" }
    );
    console.log('Update entry status response:', response.data);
    return { success: true, data: response.data }; // DRF returns the updated entry
  } catch (error) {
    console.error('Error updating entry status:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || error.response?.data?.error || 'Failed to update status' 
    };
  }
};

// Function to remove entry from waitlist
const removeWaitlistEntry = async (entryId) => {
  try {
    await apiClient.delete(`/api/waitlist/entries/${entryId}/`);
    console.log(`Entry ${entryId} removed successfully.`);
    return { success: true }; // DELETE usually returns 204 No Content
  } catch (error) {
    console.error('Error removing entry:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || error.response?.data?.error || 'Failed to remove entry' 
    };
  }
};

// Function to add an entry to the waitlist (replaces addParty and addToWaitlist)
const addWaitlistEntry = async (entryData) => {
  console.log('Adding waitlist entry with data:', entryData);
  try {
    // Backend expects JSON, ensure entryData matches WaitlistEntrySerializer fields
    const response = await apiClient.post('/api/waitlist/entries/', entryData);
    console.log('Add waitlist entry API response:', response.data);
    return {
      success: true,
      data: response.data // DRF returns the created entry
    };
  } catch (error) {
    console.error('Error adding waitlist entry:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to add entry' 
    };
  }
};

// Function to edit an entry in the waitlist
const editWaitlistEntry = async (entryId, updatedData) => {
  try {
    // Backend expects JSON
    const response = await apiClient.put(`/api/waitlist/entries/${entryId}/`, updatedData);
    console.log('Edit waitlist entry response:', response.data);
    return { success: true, data: response.data }; // DRF returns the updated entry
  } catch (error) {
    console.error('Error editing entry:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to update entry' 
    };
  }
};

// Function to update column settings for the waitlist display
const updateWaitlistColumnSettings = async (columns) => {
  try {
    const response = await apiClient.post('/api/waitlist/config/', { columns });
    console.log('Update column settings response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating column settings:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || error.response?.data?.error || 'Failed to update column settings' 
    };
  }
};

// Function to get a single waitlist entry by ID
const getWaitlistEntryById = async (entryId) => {
  try {
    const response = await apiClient.get(`/api/waitlist/entries/${entryId}/`);
    console.log('Get waitlist entry by ID response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching single waitlist entry:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch entry'
    };
  }
};

// Function to send a notification (SMS/Email) via the notifications app
const sendAppNotification = async (notificationData) => {
  // Expected notificationData: { entry_id, notification_type ('sms', 'email', 'both'), message?, subject?, email_context? }
  try {
    const response = await apiClient.post('/api/notifications/send/', notificationData);
    console.log('Send notification response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.error || 'Failed to send notification'
    };
  }
};

// Old functions that need to be updated or removed:
// fetchWaitlist -> replaced by getWaitlistData
// fetchQRCode -> replaced by fetchQRCodeOnly or getWaitlistData
// refreshQueue -> effectively getWaitlistData or just refetch
// addToWaitlist -> replaced by addWaitlistEntry
// editEntry -> replaced by editWaitlistEntry
// sendSmsNotification -> replaced by sendAppNotification
// seatParty -> use updateEntryStatus with status 'SERVED'
// markNoShow -> use updateEntryStatus with status 'REMOVED' or custom status

// Placeholder for other functions that might exist in the original file
// like getTablesConfig, getEstimatedWaitTime etc.
// These would need to be mapped to new backend endpoints if they exist,
// or their logic re-evaluated based on available data from getWaitlistData.

export {
  getWaitlistData, // Main function to get all relevant data for waitlist page
  fetchQRCodeOnly, // If QR is needed in isolation
  addWaitlistEntry,
  editWaitlistEntry,
  updateEntryStatus,
  removeWaitlistEntry,
  updateWaitlistColumnSettings,
  getWaitlistEntryById,
  sendAppNotification, // Replaces sendSmsNotification and can do more
  // ... any other relevant exports that are kept or refactored ...
}; 