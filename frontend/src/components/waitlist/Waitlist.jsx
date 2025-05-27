import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchWaitlist, 
  fetchQRCode, 
  updateEntryStatus, 
  removeEntry,
  addParty,
  editEntry,
  updateColumnSettings
} from '../../services/waitlistService';
import { logout } from '../../services/authService';
import AddPartyModal from './AddPartyModal';
import EditPartyModal from './EditPartyModal';
import WaitlistTable from './WaitlistTable';

// Import subcomponents
import Sidebar from '../shared/Sidebar';
import Header from './Header';
import QRCodeModal from './QRCodeModal';
import ColumnSettingsModal from './ColumnSettingsModal';
import WaitlistStyles from './WaitlistStyles';

const Waitlist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurantName, setRestaurantName] = useState('Restaurant Name');
  const [queueCount, setQueueCount] = useState(0);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [joinURL, setJoinURL] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Loading state for initial load
  const [loading, setLoading] = useState(true);
  
  // Flag to track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // State for General loading state for UI operations
  const [isLoading, setIsLoading] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState(null);
  
  // Columns to display
  const [visibleColumns, setVisibleColumns] = useState(['arrival_time', 'notes', 'status']);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Restaurant ID state
  const [restaurantId, setRestaurantId] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null);
  
  // Auto-update wait times
  const waitTimeIntervalRef = useRef(null);
  
  // Store previous entries for comparison
  const prevEntriesRef = useRef([]);
  
  // State for Add Party modal form
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    people_count: '',
    quoted_time: '15',
    notes: ''
  });
  
  // State for Edit Party modal form
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    phone_number: '',
    people_count: '',
    quoted_time: '',
    notes: ''
  });
  
  // State for column selections
  const [columnSelections, setColumnSelections] = useState([]);
  
  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  
  // Hide toast notification
  const hideToast = () => {
    setToast(null);
  };

  // Fetch waitlist data from API with loading state
  const loadWaitlistData = useCallback(async () => {
    console.log('Attempting to load waitlist data...');
    
    // Show loading indicator only on initial load
    if (!initialLoadComplete) {
      setLoading(true);
    }
    
    try {
      // Reset error but keep existing data
      setError(null);
      
      // Get data in the background
      const data = await fetchWaitlist();
      console.log('Waitlist API response:', data);
      
      if (!data) {
        throw new Error('No data received from API');
      }
      
      // Only update these values if they've changed to prevent unnecessary renders
      if (data.restaurant?.name && data.restaurant.name !== restaurantName) {
        setRestaurantName(data.restaurant.name);
      }
      
      if (data.queue_count !== undefined && data.queue_count !== queueCount) {
        setQueueCount(data.queue_count);
      }
      
      if (data.restaurant?.waitlist_columns) {
        setVisibleColumns(data.restaurant.waitlist_columns);
      }
      
      if (data.restaurant?.id && data.restaurant.id !== restaurantId) {
        setRestaurantId(data.restaurant.id);
      }
      
      // Transform API data structure to component structure
      if (data.queue_entries && Array.isArray(data.queue_entries)) {
        const transformedEntries = data.queue_entries.map((entry, index) => ({
          id: entry.id,
          customerName: entry.customer_name || '',
          phoneNumber: entry.phone_number || '',
          peopleCount: entry.people_count || 0,
          timestamp: entry.timestamp || '',
          waitTimeMinutes: entry.wait_time_minutes || 0,
          status: entry.status || 'WAITING',
          notes: entry.notes || '',
          isReservation: (entry.notes || '').includes('Reservation for'),
          position: index + 1, // Store position for ordering
        }));
        
        // Update state with transformed entries
        setWaitlistEntries(transformedEntries);
      } else {
        console.warn('No queue entries in API response or unexpected format:', data);
        setWaitlistEntries([]);
      }
      
      // Mark initial load as complete
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    } catch (err) {
      console.error('Error loading waitlist data:', err);
      
      // Check if this is an authentication error
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Authentication error - please log in again.');
        console.error('Authentication error detected, redirecting to login');
        
        // Clear authentication state and redirect to login
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        
        // Small delay to show error before redirect
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        // Other errors
        setError('Failed to load waitlist data. Please try again.');
      }
    } finally {
      // Always hide loading state in the end
      setLoading(false);
    }
  }, [initialLoadComplete, navigate]);

  // Fetch QR code
  const loadQRCode = async () => {
    try {
      console.log('Loading QR code data...');
      setIsLoading(true); // Show loading indicator while fetching
      
      const { qr_code, join_url } = await fetchQRCode();
      console.log('QR code loaded:', qr_code ? 'QR code available' : 'QR code missing');
      console.log('Join URL:', join_url);
      
      // Only update state if we actually have data
      if (qr_code) {
        setQrCodeURL(qr_code);
      } else {
        console.error('QR code data is empty or invalid');
        showToast('Failed to load QR code. Please try again later.', 'error');
      }
      
      if (join_url) {
        setJoinURL(join_url);
      } else {
        console.error('Join URL is empty or invalid');
      }
    } catch (err) {
      console.error('Error loading QR code:', err);
      showToast('Failed to load QR code. Please try again later.', 'error');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Initial data load (this useEffect should remain to load data once on mount)
  useEffect(() => {
    loadWaitlistData().catch(err => {
      console.error('Failed to load initial waitlist data:', err);
      setError('Failed to load waitlist data. Please check your connection or try again later.');
      setLoading(false);
    });
  }, [loadWaitlistData]); // Depends on loadWaitlistData to ensure it has the correct reference

  // Load QR code only when the QR modal is opened
  useEffect(() => {
    if (showQRModal) {
      loadQRCode();
    }
  }, [showQRModal]);

  // Set up real-time wait time updates with minimal UI changes
  useEffect(() => {
    // Function to update wait times
    const updateWaitTimes = () => {
      const now = new Date();
      setWaitlistEntries(entries => 
        entries.map(entry => {
          // Only recalculate if we have a timestamp to work with
          if (!entry.timestamp) return entry;
          
          try {
            // Try to parse the timestamp
            let entryTime;
            
            if (typeof entry.timestamp === 'string') {
              // Handle different timestamp formats
              if (entry.timestamp.includes(':') && !entry.timestamp.includes('-')) {
                // It's in HH:MM format, create a date for today with that time
                const [hours, minutes] = entry.timestamp.split(':').map(Number);
                entryTime = new Date();
                entryTime.setHours(hours, minutes, 0, 0);
              } else {
                // It's a full date string
                entryTime = new Date(entry.timestamp);
              }
              
              if (!isNaN(entryTime.getTime())) {
                const waitTime = Math.floor((now.getTime() - entryTime.getTime()) / (1000 * 60));
                // Only update if the wait time has actually changed
                if (waitTime !== entry.waitTimeMinutes) {
                  return { ...entry, waitTimeMinutes: waitTime };
                }
              }
            }
          } catch (err) {
            console.error('Error calculating wait time:', err);
          }
          
          // Return unchanged entry if calculation failed or no change needed
          return entry;
        })
      );
    };
    
    // Update wait times every 30 seconds
    waitTimeIntervalRef.current = setInterval(updateWaitTimes, 30000);
    
    // Clean up on unmount
    return () => {
      if (waitTimeIntervalRef.current) {
        clearInterval(waitTimeIntervalRef.current);
      }
    };
  }, []);
  
  // Filter entries based on search term and status filter
  const filteredEntries = waitlistEntries.filter(entry => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      entry.phoneNumber.includes(searchTerm);
    
    // Apply status filter
    const matchesStatus = statusFilter === 'All Statuses' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleLogout = async () => {
    try {
      // Call the authentication service to log out
      await logout();
      // Navigate to login page
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      // Still navigate to login
      navigate('/login');
    }
  };

  const openQRModal = () => {
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinURL);
    alert('Link copied to clipboard!');
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setEditFormData({
      customer_name: entry.customerName,
      phone_number: entry.phoneNumber,
      people_count: entry.peopleCount.toString(),
      quoted_time: entry.waitTimeMinutes.toString(),
      notes: entry.notes
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEntry(null);
  };

  // Open Column modal
  const openColumnModal = () => {
    // Initialize column selections from current visible columns
    setColumnSelections([...visibleColumns]);
    setShowColumnModal(true);
  };

  // Close Column modal
  const closeColumnModal = () => {
    setShowColumnModal(false);
  };

  // Handle column selection change
  const handleColumnSelectionChange = (column) => {
    setColumnSelections(prev => {
      // If column is already selected, remove it
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      }
      // Otherwise add it
      return [...prev, column];
    });
  };

  // Handle column settings form submission
  const handleColumnSettingsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Make an API call to save the user's column preferences to the backend
      const result = await updateColumnSettings(columnSelections);
      
      if (result.success) {
        // Update the visible columns state after successful server update
        setVisibleColumns(columnSelections);
        showToast('Column settings updated successfully', 'success');
      } else {
        showToast(result.message || 'Failed to update column settings', 'error');
      }
      
      // Close modal
      closeColumnModal();
    } catch (err) {
      console.error('Error updating column settings:', err);
      showToast('An error occurred while updating column settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update handle status change and handle remove functions to show toast notifications
  const handleStatusChange = async (id, status) => {
    try {
      const result = await updateEntryStatus(id, status);
      
      if (result.success) {
        if (status === 'SERVED' || status === 'CANCELLED') {
          // Remove the entry from the list if it's served or cancelled
          setWaitlistEntries(entries => entries.filter(entry => entry.id !== id));
          setQueueCount(prev => prev - 1);
          showToast(`Party ${status === 'SERVED' ? 'marked as served' : 'cancelled'} successfully`, 'success');
        } else {
          // Update the status if it's still in the list
          setWaitlistEntries(entries => 
            entries.map(entry => 
              entry.id === id ? { ...entry, status } : entry
            )
          );
          showToast(`Party status updated to ${status.toLowerCase()}`, 'success');
        }
      } else {
        showToast('Failed to update status: ' + (result.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('An error occurred while updating status', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this party?')) {
      try {
        const result = await removeEntry(id);
        
        if (result.success) {
          setWaitlistEntries(entries => entries.filter(entry => entry.id !== id));
          setQueueCount(prev => prev - 1);
          showToast('Party removed successfully', 'success');
        } else {
          showToast('Failed to remove entry: ' + (result.message || 'Unknown error'), 'error');
        }
      } catch (err) {
        console.error('Error removing entry:', err);
        showToast('An error occurred while removing the entry', 'error');
      }
    }
  };
  
  // Reset form data when modal is closed or opened
  useEffect(() => {
    if (!showAddModal) {
      // Reset form when modal closes
      setFormData({
        customer_name: '',
        phone_number: '',
        people_count: '',
        quoted_time: '15',
        notes: ''
      });
    }
  }, [showAddModal]);

  // Handle input changes for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle party size selection
  const handleSizeSelect = (size) => {
    setFormData({
      ...formData,
      people_count: size.toString()
    });
  };

  // Handle quoted time adjustment
  const adjustQuotedTime = (amount) => {
    const currentTime = parseInt(formData.quoted_time) || 15;
    const newTime = Math.max(5, currentTime + amount); // Ensure minimum of 5 minutes
    setFormData({
      ...formData,
      quoted_time: newTime.toString()
    });
  };

  // Update handleAddPartySubmit to work with regular HTTP updates
  const handleAddPartySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await addParty({
        customer_name: formData.customer_name,
        phone_number: formData.phone_number,
        people_count: formData.people_count,
        quoted_time: formData.quoted_time,
        notes: formData.notes
      });
      
      if (response.success) {
        showToast('Party added successfully!', 'success');
        setShowAddModal(false);
        // Reset form data
        setFormData({
          customer_name: '',
          phone_number: '',
          people_count: '',
          quoted_time: '15',
          notes: ''
        });
        // Refresh the waitlist data
        await loadWaitlistData();
      } else {
        showToast(response.message || 'Failed to add party', 'error');
      }
    } catch (error) {
      console.error('Error adding party:', error);
      showToast('Failed to add party. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input changes for edit form fields
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle party size selection in edit modal
  const handleEditSizeSelect = (size) => {
    setEditFormData({
      ...editFormData,
      people_count: size.toString()
    });
  };

  // Handle quoted time adjustment in edit modal
  const adjustEditQuotedTime = (amount) => {
    const currentTime = parseInt(editFormData.quoted_time) || 15;
    const newTime = Math.max(5, currentTime + amount); // Ensure minimum of 5 minutes
    setEditFormData({
      ...editFormData,
      quoted_time: newTime.toString()
    });
  };

  // Handle edit form submission
  const handleEditPartySubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEntry) return;
    
    // Validate form
    if (!editFormData.customer_name || !editFormData.phone_number || !editFormData.people_count) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      // Convert people_count to number
      const updatedData = {
        customer_name: editFormData.customer_name,
        phone_number: editFormData.phone_number,
        people_count: parseInt(editFormData.people_count),
        quoted_time: parseInt(editFormData.quoted_time),
        notes: editFormData.notes
      };
      
      const result = await editEntry(selectedEntry.id, updatedData);
      
      if (result.success) {
        showToast('Party updated successfully', 'success');
        
        // Close modal
        closeEditModal();
      } else {
        showToast(result.message || 'Failed to update party', 'error');
      }
    } catch (err) {
      console.error('Error updating party:', err);
      showToast('An error occurred while updating the party', 'error');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar handleLogout={handleLogout} currentPath={location.pathname} />

      {/* Main Content */}
      <main className="flex-1 ml-20">
        {/* Header */}
        <Header 
          restaurantName={restaurantName}
          queueCount={queueCount}
          openQRModal={openQRModal}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          openColumnModal={openColumnModal}
        />

        {/* Waitlist Table */}
        <WaitlistTable 
          error={error}
          loading={loading}
          waitlistEntries={waitlistEntries}
          filteredEntries={filteredEntries}
          visibleColumns={visibleColumns}
          openAddModal={openAddModal}
          openQRModal={openQRModal}
          openEditModal={openEditModal}
          handleStatusChange={handleStatusChange}
          handleRemove={handleRemove}
        />
      </main>

      {/* Floating Add Button */}
      <button 
        className="fixed bottom-10 right-10 bg-blue-600 text-white p-6 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        onClick={openAddModal}
      >
        <i className="fas fa-plus text-xl"></i>
      </button>

      {/* Modals */}
      <QRCodeModal 
        showQRModal={showQRModal}
        closeQRModal={closeQRModal}
        restaurantName={restaurantName}
        qrCodeURL={qrCodeURL}
        joinURL={joinURL}
        copyJoinLink={copyJoinLink}
      />
      
      <AddPartyModal 
        showAddModal={showAddModal}
        closeAddModal={closeAddModal}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSizeSelect={handleSizeSelect}
        adjustQuotedTime={adjustQuotedTime}
        handleAddPartySubmit={handleAddPartySubmit}
      />
      
      <EditPartyModal 
        showEditModal={showEditModal}
        closeEditModal={closeEditModal}
        selectedEntry={selectedEntry}
        editFormData={editFormData}
        handleEditInputChange={handleEditInputChange}
        handleEditSizeSelect={handleEditSizeSelect}
        adjustEditQuotedTime={adjustEditQuotedTime}
        handleEditPartySubmit={handleEditPartySubmit}
      />
      
      <ColumnSettingsModal 
        showColumnModal={showColumnModal}
        closeColumnModal={closeColumnModal}
        columnSelections={columnSelections}
        handleColumnSelectionChange={handleColumnSelectionChange}
        handleColumnSettingsSubmit={handleColumnSettingsSubmit}
      />


      {/* CSS Styles */}
      <WaitlistStyles />
    </div>
  );
};

export default Waitlist; 