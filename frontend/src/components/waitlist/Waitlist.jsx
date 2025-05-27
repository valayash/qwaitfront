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
// NEW: Import WebSocket service
import { connectToWaitlistSocket, disconnectWebSocket } from '../../services/realtimeService'; // Adjust path if needed

import AddPartyModal from './AddPartyModal';
import EditPartyModal from './EditPartyModal';
import WaitlistTable from './WaitlistTable';

// Import subcomponents
import Sidebar from '../shared/Sidebar';
import Header from './Header';
import QRCodeModal from './QRCodeModal';
import ColumnSettingsModal from './ColumnSettingsModal';
import WaitlistStyles from './WaitlistStyles';
// Assuming you might want a toast component (if not already implicitly handled by WaitlistStyles)
// import Toast from './Toast'; // If you have a separate Toast.jsx

// Helper function to transform API/WebSocket entry to component's expected structure
const transformApiEntryToComponentFormat = (apiEntry) => {
  let calculatedWaitTimeMinutes = 0;
  if (apiEntry.timestamp && (apiEntry.status === 'WAITING' || apiEntry.status === 'NOTIFIED')) {
    const arrivalTime = new Date(apiEntry.timestamp);
    const now = new Date();
    const diffMilliseconds = now.getTime() - arrivalTime.getTime();
    calculatedWaitTimeMinutes = Math.max(0, Math.floor(diffMilliseconds / (1000 * 60)));
  } else if (apiEntry.wait_time_minutes) {
    calculatedWaitTimeMinutes = apiEntry.wait_time_minutes;
  }

  return {
    id: apiEntry.id,
    customerName: apiEntry.customer_name || '',
    phoneNumber: apiEntry.phone_number || '',
    peopleCount: apiEntry.people_count || 0,
    timestamp: apiEntry.timestamp || '',
    waitTimeMinutes: calculatedWaitTimeMinutes,
    status: apiEntry.status || 'WAITING',
    notes: apiEntry.notes || '',
    isReservation: (apiEntry.notes || '').includes('Reservation for'),
    // position is no longer set here; it will be handled by assignPositions
  };
};

// Helper function to sort entries and assign positions
const assignPositions = (entries) => {
  const sortedEntries = [...entries].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    if (timeA === 0 && timeB === 0) return 0; // both no timestamp
    if (timeA === 0) return 1; // a comes after b if a has no timestamp
    if (timeB === 0) return -1; // b comes after a if b has no timestamp
    return timeA - timeB;
  });

  let currentPosition = 1;
  return sortedEntries.map(entry => {
    if (entry.status === 'WAITING' || entry.status === 'NOTIFIED') {
      return { ...entry, position: currentPosition++ };
    }
    return { ...entry, position: null }; // Assign null for non-active entries
  });
};

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
  const [loading, setLoading] = useState(true); // For initial full page load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For individual operations like submitting a modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(['arrival_time', 'notes', 'status']);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [toast, setToast] = useState(null);
  const waitTimeIntervalRef = useRef(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    people_count: '',
    quoted_time: '15',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    phone_number: '',
    people_count: '',
    quoted_time: '',
    notes: ''
  });
  const [columnSelections, setColumnSelections] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    // Auto-hide toast after a few seconds
    setTimeout(() => setToast(null), 3000);
  }, [setToast]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, [setToast]);

  const handleDownloadQRCode = () => {
    if (qrCodeURL) {
      const link = document.createElement('a');
      link.href = qrCodeURL;
      // Sanitize restaurant name for filename
      const fileName = `${restaurantName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('QR Code download started!', 'info');
    } else {
      showToast('QR Code not available for download.', 'error');
    }
  };

  // Fetch waitlist data from API with loading state
  const loadWaitlistData = useCallback(async () => {
    console.log('Attempting to load initial waitlist data...');
    if (!initialLoadComplete) {
      setLoading(true); // Full page loading indicator
    }
    try {
      setError(null);
      const data = await fetchWaitlist();
      console.log('Waitlist API response:', data);
      if (!data) throw new Error('No data received from API');

      if (data.restaurant?.name) setRestaurantName(data.restaurant.name);
      if (data.restaurant?.waitlist_columns) setVisibleColumns(data.restaurant.waitlist_columns);
      if (data.restaurant?.id) setRestaurantId(data.restaurant.id); // IMPORTANT: Sets restaurantId

      if (data.queue_entries && Array.isArray(data.queue_entries)) {
        const transformedEntries = data.queue_entries.map(entry =>
          transformApiEntryToComponentFormat(entry) // Simplified call
        );
        setWaitlistEntries(assignPositions(transformedEntries)); // Use assignPositions
      } else {
        console.warn('No queue entries in API response or unexpected format:', data);
        setWaitlistEntries([]);
      }

      if (!initialLoadComplete) setInitialLoadComplete(true);
    } catch (err) {
      console.error('Error loading waitlist data:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Authentication error - please log in again.');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError('Failed to load waitlist data. Please try again.');
      }
    } finally {
      if (!initialLoadComplete) setLoading(false);
    }
  }, [initialLoadComplete, navigate]); // Dependencies for useCallback

  // Initial data load
  useEffect(() => {
    loadWaitlistData().catch(err => {
      console.error('Failed to load initial waitlist data:', err);
      setError('Failed to load waitlist data. Please check your connection or try again later.');
      if (!initialLoadComplete) setLoading(false);
    });
  }, [loadWaitlistData]); // Runs when loadWaitlistData reference changes (which is memoized)

  // Effect to derive queueCount from waitlistEntries
  useEffect(() => {
    const activeEntriesCount = waitlistEntries.filter(
      entry => entry.status === 'WAITING' || entry.status === 'NOTIFIED' // Define what counts as an active queue member
    ).length;
    setQueueCount(activeEntriesCount);
  }, [waitlistEntries]);

  // --- WebSocket Integration ---
  const handleWebSocketMessage = useCallback((message) => {
    console.log('WebSocket message received:', message);
    if (!message.type || !message.payload) {
        console.warn("Received malformed WebSocket message:", message);
        return;
    }

    const payloadEntry = typeof message.payload === 'object' ? message.payload : { id: message.payload };

    switch (message.type) {
      case 'NEW_WAITLIST_ENTRY':
        {
          setWaitlistEntries(prevEntries => {
            const newEntry = transformApiEntryToComponentFormat(payloadEntry);
            if (prevEntries.some(e => e.id === newEntry.id)) return prevEntries;
            return assignPositions([...prevEntries, newEntry]);
          });
          showToast(`New party "${payloadEntry.customer_name || 'Unknown'}" joined the waitlist!`, 'info');
          break;
        }
      case 'ENTRY_UPDATED':
        {
          setWaitlistEntries(prevEntries => {
            const receivedEntry = transformApiEntryToComponentFormat(payloadEntry);
            let entryExists = false;
            const updatedList = prevEntries.map(entry => {
              if (entry.id === receivedEntry.id) {
                entryExists = true;
                return { ...entry, ...receivedEntry };
              }
              return entry;
            });
            if (entryExists) {
              return assignPositions(updatedList);
            } else {
              // If entry wasn't found, add it to the list
              return assignPositions([...prevEntries, receivedEntry]);
            }
          });
          showToast(`Waitlist updated for "${payloadEntry.customer_name || 'Unknown'}".`, 'info');
          break;
        }
      case 'ENTRY_REMOVED':
        {
          const removedEntryId = payloadEntry.id;
          let partyName = 'A party';
          setWaitlistEntries(prevEntries => {
            const entryToRemove = prevEntries.find(e => e.id === removedEntryId);
            if (entryToRemove) partyName = entryToRemove.customerName;
            const filteredEntries = prevEntries.filter(entry => entry.id !== removedEntryId);
            return assignPositions(filteredEntries);
          });
          showToast(`Party "${partyName}" removed from waitlist.`, 'info');
          break;
        }
      case 'WAITLIST_COLUMNS_UPDATED':
          if (message.payload.columns) {
            setVisibleColumns(message.payload.columns);
            showToast('Display columns updated.', 'info');
          }
          break;
      default:
        console.warn('Unhandled WebSocket message type:', message.type);
    }
  }, [showToast, setVisibleColumns]);

  useEffect(() => {
    if (restaurantId) {
      console.log(`Restaurant ID is set (${restaurantId}), attempting WebSocket connection.`);
      connectToWaitlistSocket(restaurantId, handleWebSocketMessage);

      return () => {
        console.log('Cleaning up WebSocket connection.');
        disconnectWebSocket();
      };
    } else {
      console.log('Restaurant ID not yet available for WebSocket connection.');
    }
  }, [restaurantId, handleWebSocketMessage]); // Reconnect if restaurantId or handler changes

  // --- End WebSocket Integration ---

  // --- Wait Time Updater ---
  useEffect(() => {
    const updateWaitTimes = () => {
      setWaitlistEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.status !== 'WAITING' && entry.status !== 'NOTIFIED') {
            return entry; // Don't update wait time for served/cancelled parties
          }
          if (!entry.timestamp) {
            return { ...entry, waitTimeMinutes: 0 }; // Should not happen if timestamp is always set
          }
          const arrivalTime = new Date(entry.timestamp);
          const now = new Date();
          const diffMilliseconds = now.getTime() - arrivalTime.getTime();
          const waitTimeMinutes = Math.max(0, Math.floor(diffMilliseconds / (1000 * 60)));
          return { ...entry, waitTimeMinutes };
        })
      );
    };

    // Update immediately on load and then set interval
    updateWaitTimes(); 
    waitTimeIntervalRef.current = setInterval(updateWaitTimes, 30000); // Update every 30 seconds

    return () => {
      if (waitTimeIntervalRef.current) {
        clearInterval(waitTimeIntervalRef.current);
      }
    };
  }, []); // Empty dependency array: run once on mount, cleanup on unmount. 
          // If entries were not updating, it might be because `waitlistEntries` was in dependency array causing loop.
  // --- End Wait Time Updater ---

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
  useEffect(() => { if (showQRModal) loadQRCode(); }, [showQRModal]);

  const filteredEntries = waitlistEntries.filter(entry => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = entry.customerName?.toLowerCase().includes(searchTermLower);
    const phoneMatch = entry.phoneNumber?.toLowerCase().includes(searchTermLower);
    const statusMatch = statusFilter === 'All Statuses' || entry.status === statusFilter;

    return (nameMatch || phoneMatch) && statusMatch;
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
  const openQRModal = () => setShowQRModal(true);
  const closeQRModal = () => setShowQRModal(false);
  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinURL);
    alert('Link copied to clipboard!');
  };
  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);
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
    setSelectedEntry(null);
    setEditFormData({
      customer_name: '',
      phone_number: '',
      people_count: '',
      quoted_time: '',
      notes: ''
    });
    setShowEditModal(false);
  };
  const openColumnModal = () => {
    // Initialize column selections from current visible columns
    setColumnSelections([...visibleColumns]);
    setShowColumnModal(true);
  };
  const closeColumnModal = () => setShowColumnModal(false);
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


  const handleColumnSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // The backend should broadcast 'WAITLIST_COLUMNS_UPDATED' via WebSocket upon success
      const result = await updateColumnSettings(columnSelections);
      if (result.success) {
        // Optimistic update or rely on WebSocket:
        // setVisibleColumns(columnSelections); // Optimistic
        showToast('Column settings submitted. Update will reflect shortly.', 'success');
      } else {
        showToast(result.message || 'Failed to update column settings', 'error');
      }
      closeColumnModal();
    } catch (err) {
      console.error('Error updating column settings:', err);
      showToast('An error occurred while updating column settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const result = await updateEntryStatus(id, status);
      
      if (result.success) {
        if (status === 'SERVED' || status === 'CANCELLED') {
          setWaitlistEntries(entries => entries.filter(entry => entry.id !== id));
          showToast(`Party ${status === 'SERVED' ? 'marked as served' : 'cancelled'} successfully`, 'success');
        } else {
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
    const entryToRemove = waitlistEntries.find(entry => entry.id === id);
    if (!entryToRemove) return;

    if (window.confirm(`Are you sure you want to remove ${entryToRemove.customerName}?`)) {
      setIsLoading(true);

      // Optimistic UI Update
      const originalEntries = [...waitlistEntries];
      setWaitlistEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));

      try {
        const result = await removeEntry(id);
        if (result.success) {
          showToast(`${entryToRemove.customerName} has been successfully removed.`, 'success');
        } else {
          showToast(`Failed to remove ${entryToRemove.customerName}: ${result.message || 'Unknown error'}`, 'error');
          setWaitlistEntries(originalEntries); // Rollback entries, useEffect will update count
        }
      } catch (err) {
        console.error('Error removing entry:', err);
        showToast(`An error occurred while removing ${entryToRemove.customerName}.`, 'error');
        setWaitlistEntries(originalEntries); // Rollback entries, useEffect will update count
      } finally {
        setIsLoading(false);
      }
    }
  };

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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleSizeSelect = (size) => {
    setFormData({
      ...formData,
      people_count: size.toString()
    });
  };
  const adjustQuotedTime = (amount) => {
    const currentTime = parseInt(formData.quoted_time) || 15;
    const newTime = Math.max(5, currentTime + amount); // Ensure minimum of 5 minutes
    setFormData({
      ...formData,
      quoted_time: newTime.toString()
    });
  };

  const handleAddPartySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Backend will broadcast 'NEW_WAITLIST_ENTRY'
      const response = await addParty({ /* ... formData ... */ });
      if (response.success) {
        showToast('Party added successfully! It will appear shortly.', 'success');
        setShowAddModal(false);
        setFormData({ customer_name: '', phone_number: '', people_count: '', quoted_time: '15', notes: '' });
        // DO NOT call loadWaitlistData() here. Rely on WebSocket.
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

  const handleEditInputChange = (e) => { 
     const { name, value } = e.target;
     setEditFormData({
       ...editFormData,
        [name]: value
    }); 
  };
  const handleEditSizeSelect = (size) => { setEditFormData({
    ...editFormData,
    people_count: size.toString()
  }); };
    // Handle quoted time adjustment in edit modal
  const adjustEditQuotedTime = (amount) => {
    const currentTime = parseInt(editFormData.quoted_time) || 15;
    const newTime = Math.max(5, currentTime + amount); // Ensure minimum of 5 minutes
    setEditFormData({
      ...editFormData,
      quoted_time: newTime.toString()
    });
  };
  const handleEditPartySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntry) return;
    // ... (validation) ...
    setIsLoading(true);
    try {
      const updatedData = { /* ... editFormData ... */ };
      // Backend will broadcast 'ENTRY_UPDATED'
      const result = await editEntry(selectedEntry.id, updatedData);
      if (result.success) {
        showToast('Party update submitted. It will reflect shortly.', 'success');
        closeEditModal();
        // DO NOT call loadWaitlistData() here. Rely on WebSocket.
      } else {
        showToast(result.message || 'Failed to update party', 'error');
      }
    } catch (err) {
      console.error('Error updating party:', err);
      showToast('An error occurred while updating the party', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar handleLogout={handleLogout} currentPath={location.pathname} />
      <main className="flex-1 ml-20">
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
        {/* Display global error if any */}
        {error && !loading && <div className="p-4 m-4 text-red-700 bg-red-100 border border-red-400 rounded">{error}</div>}
        
        {/* Show loading for the entire table only on initial load */}
        {loading && <div className="p-4 m-4 text-center">Loading entire waitlist...</div>}

        {!loading && !error && (
          <WaitlistTable 
            error={error}
            loading={loading}
            waitlistEntries={waitlistEntries} // Send all entries
            filteredEntries={filteredEntries} // Send filtered for display
            visibleColumns={visibleColumns}
            openAddModal={openAddModal}
            openQRModal={openQRModal}
            openEditModal={openEditModal}
            handleStatusChange={handleStatusChange}
            handleRemove={handleRemove}
            // Pass isLoading for row-level actions if WaitlistTable needs to show per-row spinners
            isActionLoading={isLoading} 
          />
        )}
      </main>

      {/* Floating Add Button */}
      <button /* ... */ onClick={openAddModal}> <i className="fas fa-plus text-xl"></i> </button>

      {/* Modals */}
      <QRCodeModal 
        showQRModal={showQRModal}
        closeQRModal={closeQRModal}
        restaurantName={restaurantName}
        qrCodeURL={qrCodeURL}
        joinURL={joinURL}
        copyJoinLink={copyJoinLink}
        handleDownloadQRCode={handleDownloadQRCode}
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
      
      {/* Toast Notification Display */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 p-4 rounded-md shadow-lg text-white
                      ${toast.type === 'success' ? 'bg-green-500' : ''}
                      ${toast.type === 'error' ? 'bg-red-500' : ''}
                      ${toast.type === 'info' ? 'bg-blue-500' : ''}`}
          onClick={hideToast} // Allow clicking to dismiss
        >
          {toast.message}
        </div>
      )}

      <WaitlistStyles />
    </div>
  );
};

export default Waitlist;