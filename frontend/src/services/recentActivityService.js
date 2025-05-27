import apiClient from './apiConfig';

// Function to fetch recent activity
export const fetchRecentActivity = async () => {
  try {
    const response = await apiClient.get('/recent-activity/');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

// Function to undo an action
export const undoAction = async (entryId) => {
  try {
    const formData = new FormData();
    formData.append('undo_entry', entryId.toString());
    
    const response = await apiClient.post('/recent-activity/undo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error undoing action:', error);
    return { 
      success: false, 
      message: error.response?.data?.error || 'Failed to undo action' 
    };
  }
}; 