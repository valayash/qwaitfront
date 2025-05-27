import apiClient, { API_BASE_URL } from './apiConfig';

const fetchReservations = async () => {
  try {
    console.log('Attempting to fetch reservations from:', API_BASE_URL + '/reservations/');
    const response = await apiClient.get('/reservations/');
    console.log('Reservations response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    console.error('Request URL:', error.config ? error.config.url : 'Unknown URL');
    throw error;
  }
};

const addReservation = async (reservationData) => {
  try {
    const response = await apiClient.post('/reservations/add/', reservationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding reservation:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    console.error('Request URL:', error.config ? error.config.url : 'Unknown URL');
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to add reservation'
    };
  }
};

const editReservation = async (reservationId, reservationData) => {
  try {
    const formData = new FormData();
    formData.append('name', reservationData.name);
    formData.append('email', reservationData.email);
    formData.append('phone', reservationData.phone);
    formData.append('party_size', reservationData.party_size);
    formData.append('date', reservationData.date);
    formData.append('time', reservationData.time);
    if (reservationData.notes) {
      formData.append('notes', reservationData.notes);
    }
    
    const response = await apiClient.post(`/reservations/${reservationId}/edit/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error editing reservation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update reservation'
    };
  }
};

const deleteReservation = async (reservationId) => {
  try {
    const formData = new FormData();
    formData.append('reservation_id', reservationId);
    
    const response = await apiClient.post(`/reservations/${reservationId}/delete/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to delete reservation'
    };
  }
};

const checkInReservation = async (reservationId) => {
  try {
    const formData = new FormData();
    formData.append('reservation_id', reservationId);
    
    const response = await apiClient.post(`/reservations/${reservationId}/check-in/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error checking in reservation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to check in reservation'
    };
  }
};

const getReservation = async (reservationId) => {
  try {
    const response = await apiClient.get(`/reservations/${reservationId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reservation ${reservationId}:`, error);
    throw error;
  }
};

export {
  fetchReservations,
  addReservation,
  editReservation,
  deleteReservation,
  checkInReservation,
  getReservation
}; 