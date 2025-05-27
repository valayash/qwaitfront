import apiClient from './apiConfig';

// Function to get restaurant information (used by JoinQueue)
const getRestaurant = async (restaurantId) => {
  try {
    console.log('Getting restaurant info for ID:', restaurantId);
    const response = await apiClient.get(`/join-queue/${restaurantId}/`);
    console.log('Restaurant API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant info:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to check if phone is already in waitlist
const checkPhoneInWaitlist = async (restaurantId, phoneNumber) => {
  try {
    // Extract only digits from phone number
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    console.log('Checking if phone number exists in waitlist:', digitsOnly);
    
    const response = await apiClient.get(`/restaurant/${restaurantId}/check-phone/${digitsOnly}/`);
    console.log('Phone check response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking phone in waitlist:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to join a queue
const joinQueue = async (restaurantId, data) => {
  try {
    const response = await apiClient.post(
      `/join-queue/${restaurantId}/join/`, 
      data
    );
    
    return {
      success: true,
      queue_entry_id: response.data.queue_entry_id,
      position: response.data.position,
      estimated_wait_time: response.data.estimated_wait_time
    };
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};

// Function to get queue confirmation details
const getQueueConfirmation = async (restaurantId, queueEntryId) => {
  try {
    console.log(`Fetching queue confirmation for restaurant ${restaurantId}, entry ${queueEntryId}`);
    const response = await apiClient.get(
      `/join-queue/${restaurantId}/queue-confirmation/${queueEntryId}/`
    );
    
    console.log('Queue confirmation response:', response.data);
    
    // Add restaurant info to queue_entry to maintain backward compatibility
    if (response.data && response.data.restaurant && response.data.queue_entry) {
      response.data.queue_entry.restaurant = response.data.restaurant;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error getting queue confirmation:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to remove from queue
const removeFromQueue = async (restaurantId, queueEntryId) => {
  try {
    console.log(`Removing entry ${queueEntryId} from queue`);
    
    // Set the header to indicate this is an AJAX request
    const config = {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    const response = await apiClient.post(
      `/join-queue/${restaurantId}/queue/${queueEntryId}/leave/`,
      {},  // empty data object for POST
      config
    );
    
    console.log('Remove from queue response:', response.data);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error removing from queue:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to check queue status
const checkQueueStatus = async (restaurantId, queueEntryId) => {
  try {
    const response = await apiClient.get(
      `/join-queue/${restaurantId}/queue/${queueEntryId}/status/`
    );
    
    return {
      success: true,
      queuePosition: response.data.queue_position,
      estimatedWaitTime: response.data.estimated_wait_time,
      status: response.data.status,
      message: response.data.message,
      restaurant: response.data.restaurant
    };
  } catch (error) {
    console.error('Error checking queue status:', error);
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.message || 
                        'Failed to check queue status. Please try again.';
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Function to join the queue (submit form)
const joinQueueSubmit = async (restaurantId, formData) => {
  try {
    const response = await apiClient.post(
      `/join-queue/${restaurantId}/submit/`,
      formData
    );
    
    return {
      success: true,
      queue_entry_id: response.data.queue_entry_id,
      position: response.data.position,
      estimated_wait_time: response.data.estimated_wait_time
    };
  } catch (error) {
    console.error('Error submitting join queue form:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to join the queue. Please try again.'
    };
  }
};

// Function to cancel a place in the queue (keeping this for backward compatibility)
const cancelQueueEntry = async (restaurantId, queueEntryId) => {
  try {
    const formData = new FormData();
    formData.append('queue_entry_id', queueEntryId);
    
    const response = await apiClient.post(
      `/restaurant/${restaurantId}/cancel-queue-entry/`,
      formData
    );
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error cancelling queue entry:', error);
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.message || 
                        'Failed to cancel your place in the queue. Please try again.';
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Function to get restaurant information (keeping this for backward compatibility)
const getRestaurantInfo = async (restaurantId) => {
  try {
    const response = await apiClient.get(`/restaurant/${restaurantId}/info/`);
    
    return {
      success: true,
      restaurant: response.data
    };
  } catch (error) {
    console.error('Error getting restaurant info:', error);
    
    return {
      success: false,
      message: 'Failed to load restaurant information'
    };
  }
};

export {
  getRestaurant,
  checkPhoneInWaitlist,
  joinQueue,
  getQueueConfirmation,
  removeFromQueue,
  checkQueueStatus,
  cancelQueueEntry,
  getRestaurantInfo,
  joinQueueSubmit
}; 