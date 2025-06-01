import apiClient from './apiConfig';

// Fetch reservations for a specific restaurant and date
const fetchReservations = async (restaurantId, dateString) => {
  // dateString should be in 'YYYY-MM-DD' format
  try {
    console.log(`Fetching reservations for restaurant ${restaurantId} on ${dateString}`);
    const response = await apiClient.get(`/api/restaurants/${restaurantId}/reservations/?date=${dateString}`);
    console.log('Reservations response:', response.data);
    return response.data; // Expects { date: 'YYYY-MM-DD', reservations: [...] }
  } catch (error) {
    console.error('Error fetching reservations:', error.response?.data || error.message);
    throw error;
  }
};

// Add a new reservation for a specific restaurant
const addReservation = async (restaurantId, reservationData) => {
  // reservationData should be JSON matching ReservationSerializer fields
  try {
    const response = await apiClient.post(`/api/restaurants/${restaurantId}/reservations/`, reservationData);
    console.log('Add reservation response:', response.data);
    return { success: true, data: response.data }; // DRF returns created object
  } catch (error) {
    console.error('Error adding reservation:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to add reservation'
    };
  }
};

// Edit an existing reservation
const editReservation = async (reservationId, reservationData) => {
  // reservationData should be JSON
  try {
    const response = await apiClient.put(`/api/reservations/${reservationId}/`, reservationData);
    console.log('Edit reservation response:', response.data);
    return { success: true, data: response.data }; // DRF returns updated object
  } catch (error) {
    console.error('Error editing reservation:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to update reservation'
    };
  }
};

// Delete a reservation
const deleteReservation = async (reservationId) => {
  try {
    await apiClient.delete(`/api/reservations/${reservationId}/`);
    console.log(`Reservation ${reservationId} deleted successfully.`);
    return { success: true }; // DELETE usually returns 204 No Content
  } catch (error) {
    console.error('Error deleting reservation:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Failed to delete reservation'
    };
  }
};

// Check in a reservation (adds to waitlist)
// NOTE: Assumes backend URL for check-in is simplified to /api/reservations/{id}/check-in/
// If it remains /api/restaurants/{restaurant_id}/reservations/{id}/check-in/, this function needs restaurantId.
const checkInReservation = async (reservationId) => { 
  try {
    // If your backend requires restaurantId for this endpoint:
    // const response = await apiClient.post(`/api/restaurants/${restaurantId}/reservations/${reservationId}/check-in/`, {});
    const response = await apiClient.post(`/api/reservations/${reservationId}/check-in/`, {}); // Assumed simplified URL
    console.log('Check-in reservation response:', response.data);
    return { success: true, data: response.data }; // Backend returns { success, message, waitlist_entry_id }
  } catch (error) {
    console.error('Error checking in reservation:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.detail || error.response?.data?.error || 'Failed to check in reservation'
    };
  }
};

// Get a single reservation by ID
const getReservationDetails = async (reservationId) => {
  try {
    const response = await apiClient.get(`/api/reservations/${reservationId}/`);
    console.log('Get reservation details response:', response.data);
    return response.data; // Returns the reservation object
  } catch (error) {
    console.error(`Error fetching reservation ${reservationId} details:`, error.response?.data || error.message);
    throw error;
  }
};

// Function to fetch served parties (from WaitlistEntry with status SERVED)
const fetchServedParties = async (restaurantId) => {
  try {
    const response = await apiClient.get(`/api/restaurants/${restaurantId}/served-parties/`);
    console.log('Fetch served parties response:', response.data);
    return response.data; // Expects { success, parties, count }
  } catch (error) {
    console.error('Error fetching served parties:', error.response?.data || error.message);
    throw error;
  }
};

export {
  fetchReservations,
  addReservation,
  editReservation,
  deleteReservation,
  checkInReservation,
  getReservationDetails, // Renamed from getReservation for clarity
  fetchServedParties, // New function based on backend API
}; 