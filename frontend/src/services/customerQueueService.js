import apiClient from './apiConfig';

// Function to get restaurant information for the join queue page
const getJoinQueuePageData = async (restaurantId) => {
  try {
    console.log('Getting join queue page data for restaurant ID:', restaurantId);
    const response = await apiClient.get(`/api/customer/join-queue/${restaurantId}/`);
    console.log('Join queue page data response:', response.data);
    return response.data; // Contains restaurant info, queue_size, is_qr_scan
  } catch (error) {
    console.error('Error getting join queue page data:', error.response?.data || error.message);
    throw error;
  }
};

// Function to get basic restaurant info (e.g., after QR scan)
const getScannedRestaurantInfo = async (restaurantId) => {
  try {
    console.log('Getting scanned restaurant info for ID:', restaurantId);
    const response = await apiClient.get(`/api/customer/scan-qr/${restaurantId}/`);
    console.log('Scanned restaurant info response:', response.data);
    return response.data; // Contains restaurant id, name, join_queue_url_segment
  } catch (error) {
    console.error('Error getting scanned restaurant info:', error.response?.data || error.message);
    throw error;
  }
};

// Function to check if phone is already in waitlist for a restaurant
const checkPhoneInWaitlist = async (restaurantId, phoneNumber) => {
  try {
    // Backend might handle cleaning, or send as is if backend expects various formats
    console.log(`Checking phone ${phoneNumber} for restaurant ${restaurantId}`);
    const response = await apiClient.get(`/api/customer/check-phone/${restaurantId}/${phoneNumber}/`);
    console.log('Phone check response:', response.data); // Expects { exists: boolean, entry_id?, customer_name? }
    return response.data;
  } catch (error) {
    console.error('Error checking phone in waitlist:', error.response?.data || error.message);
    throw error;
  }
};

// Function to submit to join a queue (expects JSON data)
const joinQueueSubmit = async (restaurantId, customerData) => {
  // customerData: { customer_name, phone_number, people_count, notes? }
  try {
    const response = await apiClient.post(
      `/api/customer/join-queue/${restaurantId}/submit/`, 
      customerData // Send as JSON
    );
    console.log('Join queue submit response:', response.data);
    // Expects { success, queue_entry_id, position, estimated_wait_time, confirmation_url_segment }
    return response.data; 
  } catch (error) {
    console.error('Error submitting to join queue:', error.response?.data || error.message);
    // Return the full error response data if available, as it might contain validation errors
    throw error.response?.data || error; 
  }
};

// Function to get queue confirmation details
const getQueueConfirmationDetails = async (restaurantId, queueEntryId) => {
  try {
    console.log(`Fetching queue confirmation for restaurant ${restaurantId}, entry ${queueEntryId}`);
    const response = await apiClient.get(
      `/api/customer/queue-confirmation/${restaurantId}/${queueEntryId}/`
    );
    console.log('Queue confirmation response:', response.data);
    return response.data; // Contains restaurant, queue_entry, position, estimated_wait_time, queue_size
  } catch (error) {
    console.error('Error getting queue confirmation details:', error.response?.data || error.message);
    throw error;
  }
};

// Function for a customer to leave the queue
const leaveQueue = async (restaurantId, entryId) => {
  try {
    console.log(`Customer leaving queue: entry ${entryId} for restaurant ${restaurantId}`);
    const response = await apiClient.post(
      `/api/customer/leave-queue/${restaurantId}/${entryId}/`,
      {} // Empty payload for this POST request
    );
    console.log('Leave queue response:', response.data);
    return response.data; // Expects { success, message, redirect_url_segment }
  } catch (error) {
    console.error('Error leaving queue:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Function to check current queue status for a customer
const checkCustomerQueueStatus = async (restaurantId, entryId) => {
  try {
    const response = await apiClient.get(
      `/api/customer/queue-status/${restaurantId}/${entryId}/`
    );
    console.log('Check customer queue status response:', response.data);
    // Expects { success, restaurant, entry, position, wait_time, queue_size, minutes_in_queue, active }
    return response.data;
  } catch (error) {
    console.error('Error checking customer queue status:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// getRestaurant -> renamed to getJoinQueuePageData or use getScannedRestaurantInfo
// joinQueue -> consolidated into joinQueueSubmit
// removeFromQueue -> renamed to leaveQueue
// checkQueueStatus -> renamed to checkCustomerQueueStatus
// cancelQueueEntry -> effectively same as leaveQueue, can be removed or aliased if needed
// getRestaurantInfo -> use getJoinQueuePageData or getScannedRestaurantInfo

export {
  getJoinQueuePageData,
  getScannedRestaurantInfo,
  checkPhoneInWaitlist,
  joinQueueSubmit,
  getQueueConfirmationDetails,
  leaveQueue,
  checkCustomerQueueStatus,
}; 