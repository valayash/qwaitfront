import apiClient from './apiConfig';

const fetchParties = async () => {
  try {
    const response = await apiClient.get('/parties/');
    return response.data;
  } catch (error) {
    console.error('Error fetching parties:', error);
    throw error;
  }
};

const addPartyToWaitlist = async (partyId, waitlistData) => {
  try {
    const formData = new FormData();
    formData.append('party_id', partyId);
    formData.append('quoted_time', waitlistData.quoted_time);
    if (waitlistData.notes) {
      formData.append('notes', waitlistData.notes);
    }
    
    const response = await apiClient.post('/waitlist/add-party/', formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding party to waitlist:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to add party to waitlist'
    };
  }
};

const editParty = async (partyId, partyData) => {
  try {
    const formData = new FormData();
    formData.append('name', partyData.name);
    formData.append('phone', partyData.phone);
    if (partyData.notes) {
      formData.append('notes', partyData.notes);
    }
    
    const response = await apiClient.post(`/waitlist/party/${partyId}/edit/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error editing party:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update party'
    };
  }
};

const deleteParty = async (partyId) => {
  try {
    const formData = new FormData();
    formData.append('party_id', partyId);
    
    const response = await apiClient.post(`/parties/${partyId}/delete/`, formData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting party:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to delete party'
    };
  }
};

export {
  fetchParties,
  addPartyToWaitlist,
  editParty,
  deleteParty
}; 