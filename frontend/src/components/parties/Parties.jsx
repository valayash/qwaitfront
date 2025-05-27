import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as dateFns from 'date-fns';
import {
  fetchParties,
  addPartyToWaitlist,
  editParty,
  deleteParty
} from '../../services/partyService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faCalendarAlt,
  faUserFriends,
  faHistory,
  faChartBar,
  faCog,
  faSignOutAlt,
  faSort,
  faUserPlus,
  faPen,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './Parties.css';
import Sidebar from '../shared/Sidebar';

// Toast component for notifications
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = 
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${bgColor}`}>
      {message}
    </div>
  );
};

const Parties = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // State for party data
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [parties, setParties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToWaitlistModal, setShowAddToWaitlistModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedParties, setSelectedParties] = useState([]);
  
  // Sort state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Form state
  const [currentPartyId, setCurrentPartyId] = useState(null);
  const [editFormValues, setEditFormValues] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [waitlistFormValues, setWaitlistFormValues] = useState({
    quoted_time: 15,
    notes: ''
  });
  
  // Load party data on component mount
  useEffect(() => {
    loadParties();
  }, []);
  
  // Function to show toast messages
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  
  // Function to hide toast
  const hideToast = () => {
    setToast(null);
  };
  
  // Load parties data from the API
  const loadParties = async () => {
    setIsLoading(true);
    try {
      const data = await fetchParties();
      setRestaurantName(data.restaurant.name);
      setParties(data.parties);
    } catch (error) {
      console.error('Failed to load parties:', error);
      showToast('Failed to load parties', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle party row selection
  const handlePartySelection = (partyId) => {
    setSelectedParties(prev => {
      if (prev.includes(partyId)) {
        return prev.filter(id => id !== partyId);
      } else {
        return [...prev, partyId];
      }
    });
  };
  
  // Handle "select all" checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedParties([]);
    } else {
      setSelectedParties(parties.map(party => party.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sorted parties
  const getSortedParties = () => {
    return [...parties].sort((a, b) => {
      if (a[sortField] === null || a[sortField] === undefined) return 1;
      if (b[sortField] === null || b[sortField] === undefined) return -1;
      
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Convert dates for comparison
      if (sortField === 'last_visit' || sortField === 'created_at') {
        valueA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        valueB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      }
      
      // String comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Number comparison
      return sortDirection === 'asc'
        ? valueA - valueB
        : valueB - valueA;
    });
  };
  
  // Open edit modal
  const openEditModal = (party) => {
    setCurrentPartyId(party.id);
    setEditFormValues({
      name: party.name,
      phone: party.phone,
      notes: party.notes || ''
    });
    setShowEditModal(true);
  };
  
  // Open add to waitlist modal
  const openAddToWaitlistModal = (party) => {
    setCurrentPartyId(party.id);
    setWaitlistFormValues({
      quoted_time: 15,
      notes: party.notes || ''
    });
    setShowAddToWaitlistModal(true);
  };
  
  // Close modals
  const closeModals = () => {
    setShowEditModal(false);
    setShowAddToWaitlistModal(false);
    setCurrentPartyId(null);
  };
  
  // Handle form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle waitlist form input changes
  const handleWaitlistInputChange = (e) => {
    const { name, value } = e.target;
    setWaitlistFormValues(prev => ({ ...prev, [name]: name === 'quoted_time' ? parseInt(value) : value }));
  };
  
  // Handle edit party submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentPartyId) return;
    
    setIsLoading(true);
    
    try {
      const response = await editParty(currentPartyId, editFormValues);
      
      if (response.success) {
        showToast('Party updated successfully', 'success');
        closeModals();
        loadParties();
      } else {
        showToast(response.message || 'Failed to update party', 'error');
      }
    } catch (error) {
      console.error('Error updating party:', error);
      showToast('Failed to update party', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle add to waitlist submission
  const handleAddToWaitlistSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentPartyId) return;
    
    setIsLoading(true);
    
    try {
      const response = await addPartyToWaitlist(currentPartyId, waitlistFormValues);
      
      if (response.success) {
        showToast('Party added to waitlist successfully', 'success');
        closeModals();
        // In a real app, you might want to navigate to the waitlist page or refresh the page
      } else {
        showToast(response.message || 'Failed to add party to waitlist', 'error');
      }
    } catch (error) {
      console.error('Error adding party to waitlist:', error);
      showToast('Failed to add party to waitlist', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle party deletion
  const handleDelete = async (partyId) => {
    if (!window.confirm('Are you sure you want to delete this party?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await deleteParty(partyId);
      
      if (response.success) {
        showToast('Party deleted successfully', 'success');
        loadParties();
      } else {
        showToast(response.message || 'Failed to delete party', 'error');
      }
    } catch (error) {
      console.error('Error deleting party:', error);
      showToast('Failed to delete party', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    // In a real app, this would call an API to log out
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar handleLogout={handleLogout} currentPath={location.pathname} />

      {/* Main Content */}
      <main className="flex-1 ml-20">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} - Parties</h1>
          </div>
        </header>

        {/* Parties Table Section */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Party List</h2>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-200px)]">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Name <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('phone')}
                    >
                      Phone <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('visits')}
                    >
                      Visits <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('last_visit')}
                    >
                      Last Visit <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('notes')}
                    >
                      Notes <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Create Time <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {getSortedParties().length > 0 ? (
                    getSortedParties().map(party => (
                      <tr key={party.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4"
                            checked={selectedParties.includes(party.id)}
                            onChange={() => handlePartySelection(party.id)}
                          />
                        </td>
                        <td className="px-4 py-4 font-medium">{party.name}</td>
                        <td className="px-4 py-4">
                          {/* Only show last 4 digits of phone number */}
                          ******{party.phone.slice(-4)}
                        </td>
                        <td className="px-4 py-4">{party.visits}</td>
                        <td className="px-4 py-4">
                          {party.last_visit ? dateFns.format(new Date(party.last_visit), 'M/d/yyyy h:mm a') : '-'}
                        </td>
                        <td className="px-4 py-4">{party.notes || '-'}</td>
                        <td className="px-4 py-4">{dateFns.format(new Date(party.created_at), 'M/d/yyyy h:mm a')}</td>
                        <td className="px-4 py-4">
                          <div className="flex space-x-2">
                            <button 
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md" 
                              title="Add to Waitlist"
                              onClick={() => openAddToWaitlistModal(party)}
                            >
                              <FontAwesomeIcon icon={faUserPlus} />
                            </button>
                            <button 
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md" 
                              title="Edit"
                              onClick={() => openEditModal(party)}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button 
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md" 
                              title="Delete"
                              onClick={() => handleDelete(party.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center">
                        <div className="text-gray-400 mb-4">
                          <FontAwesomeIcon icon={faUserFriends} className="text-6xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No parties found</h3>
                        <p className="text-gray-600">Add customers to the waitlist to populate this list.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Party Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Edit Party</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={closeModals}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={editFormValues.name}
                    onChange={handleEditInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={editFormValues.phone}
                    onChange={handleEditInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea 
                    id="notes"
                    name="notes"
                    value={editFormValues.notes}
                    onChange={handleEditInputChange}
                    className="border rounded-lg px-4 py-2 w-full h-24"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add to Waitlist Modal */}
      {showAddToWaitlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Add to Waitlist</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={closeModals}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddToWaitlistSubmit}>
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="quoted_time" className="block text-sm font-medium text-gray-700 mb-2">
                    Quoted Wait Time (minutes)
                  </label>
                  <input 
                    type="number" 
                    id="quoted_time"
                    name="quoted_time"
                    min="0"
                    value={waitlistFormValues.quoted_time}
                    onChange={handleWaitlistInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="waitlist_notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea 
                    id="waitlist_notes"
                    name="notes"
                    value={waitlistFormValues.notes}
                    onChange={handleWaitlistInputChange}
                    className="border rounded-lg px-4 py-2 w-full h-24"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add to Waitlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Toast for notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
};

export default Parties; 