// frontend/src/services/partyService.js
// This service is for managing Party model entries (customer history).
// The Party model represents known customers and their visit history.

// Most of its previous functions were related to old waitlist endpoints or need new backend DRF views for the Party model.
// Functions like fetchPartyList (to list all known customers/parties for a restaurant),
// updatePartyDetails (to update customer notes, etc.), and deletePartyRecord (to remove a customer record)
// would require corresponding backend API endpoints (e.g., GET /api/parties/, PUT /api/parties/{id}/, DELETE /api/parties/{id}/).

// For now, this service is a placeholder.
// The `populate_parties` management command on the backend creates/updates Party records from WaitlistEntry history.
// To view recently served parties (which contributes to Party data), see `fetchServedParties` in `reservationService.js`.

// Example functions (require backend implementation):
/*
import apiClient from './apiConfig';

const fetchPartyList = async (restaurantId, searchTerm = null) => {
  try {
    let url = `/api/restaurants/${restaurantId}/parties/`; // Example endpoint
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching party list:', error);
    throw error;
  }
};

const updatePartyDetails = async (partyId, detailsData) => {
  try {
    const response = await apiClient.put(`/api/parties/${partyId}/`, detailsData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating party details:', error);
    return { success: false, message: error.response?.data?.detail || 'Failed to update party' };
  }
};
*/

export {
  // fetchPartyList, 
  // updatePartyDetails,
}; 