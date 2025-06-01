import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as dateFns from 'date-fns';
import {
  fetchReservations,
  addReservation,
  editReservation,
  deleteReservation,
  checkInReservation
} from '../../services/reservationService';
import { getCurrentUser } from '../../services/authService';
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
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import './Reservations.css';

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

const Reservations = () => {
  // State for reservation data
  const [userRestaurantId, setUserRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [reservationsForSelectedDate, setReservationsForSelectedDate] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dateFns.format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [currentReservationId, setCurrentReservationId] = useState(null);
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    party_size: 2,
    date: '',
    time: '',
    notes: ''
  });
  
  // Load user info and then reservations
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.restaurant_id) {
      setUserRestaurantId(currentUser.restaurant_id);
      setRestaurantName(currentUser.restaurant_name || 'My Restaurant');
    } else {
      showToast('Restaurant information not found. Please log in again.', 'error');
    }
  }, []);

  const loadReservations = useCallback(async (dateStr) => {
    if (!userRestaurantId) {
      showToast('Restaurant ID not available to fetch reservations.', 'error');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchReservations(userRestaurantId, dateStr);
      if (data && data.reservations) {
        setReservationsForSelectedDate(data.reservations);
      } else {
        setReservationsForSelectedDate([]);
        showToast(`No reservations found for ${dateStr} or error in response.`, 'warning');
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
      showToast(`Failed to load reservations for ${dateStr}: ${error.message || 'Server error'}`, 'error');
      setReservationsForSelectedDate([]);
    } finally {
      setIsLoading(false);
    }
  }, [userRestaurantId]);

  useEffect(() => {
    if (userRestaurantId && selectedDate) {
      loadReservations(selectedDate);
    }
  }, [selectedDate, userRestaurantId, loadReservations]);
  
  // Function to show toast messages
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  
  // Function to hide toast
  const hideToast = () => {
    setToast(null);
  };
  
  // Filter reservations based on search
  const getFilteredReservations = () => {
    if (!reservationsForSelectedDate) return [];
    if (!search.trim()) return reservationsForSelectedDate;
    
    return reservationsForSelectedDate.filter(
      reservation => 
        (reservation.name && reservation.name.toLowerCase().includes(search.toLowerCase())) ||
        (reservation.phone && reservation.phone.includes(search))
    );
  };
  
  // Open modal to add a new reservation
  const openAddModal = () => {
    setIsEdit(false);
    setModalTitle('Add Reservation');
    setCurrentReservationId(null);
    
    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormValues({
      name: '',
      phone: '',
      party_size: 2,
      date: dateFns.format(tomorrow, 'yyyy-MM-dd'),
      time: '19:00',
      notes: ''
    });
    
    setShowModal(true);
  };
  
  // Open modal to edit a reservation
  const openEditModal = (reservation) => {
    setIsEdit(true);
    setModalTitle('Edit Reservation');
    setCurrentReservationId(reservation.id);
    
    const [hours, minutes] = reservation.time.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    setFormValues({
      name: reservation.name,
      phone: reservation.phone,
      party_size: reservation.party_size,
      date: reservation.date,
      time: formattedTime,
      notes: reservation.notes || ''
    });
    
    setShowModal(true);
  };
  
  // Close the modal
  const closeModal = () => {
    setShowModal(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ 
      ...prev, 
      [name]: name === 'party_size' ? parseInt(value, 10) : value 
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userRestaurantId) {
      showToast('Cannot save reservation: Restaurant ID missing.', 'error');
      return;
    }
    setIsLoading(true);
    const payload = { ...formValues };

    try {
      if (isEdit && currentReservationId) {
        const response = await editReservation(currentReservationId, payload);
        
        if (response.success) {
          showToast('Reservation updated successfully', 'success');
          closeModal();
          loadReservations(selectedDate);
        } else {
          showToast(response.message || 'Failed to update reservation', 'error');
        }
      } else {
        const response = await addReservation(userRestaurantId, payload);
        
        if (response.success) {
          showToast('Reservation added successfully', 'success');
          closeModal();
          if (payload.date === selectedDate) {
            loadReservations(selectedDate);
          } else {
            setSelectedDate(payload.date);
          }
        } else {
          showToast(response.message || 'Failed to add reservation', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      showToast('Failed to save reservation: ' + (error.message || 'Server error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reservation deletion
  const handleDelete = async (reservationId, reservationDate) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await deleteReservation(reservationId);
      
      if (response.success) {
        showToast('Reservation deleted successfully', 'success');
        if (reservationDate === selectedDate) {
          loadReservations(selectedDate);
        }
      } else {
        showToast(response.message || 'Failed to delete reservation', 'error');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showToast('Failed to delete reservation', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reservation check-in
  const handleCheckIn = async (reservationId) => {
    if (!userRestaurantId) {
      showToast('Cannot check-in reservation: Restaurant ID missing.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await checkInReservation(reservationId);
      
      if (response.success) {
        showToast('Reservation checked in successfully', 'success');
        loadReservations(selectedDate);
      } else {
        showToast(response.message || 'Failed to check in reservation', 'error');
      }
    } catch (error) {
      console.error('Error checking in reservation:', error);
      showToast('Failed to check in reservation', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return dateFns.format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Determine if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return dateFns.isSameDay(today, date);
  };
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 bg-gradient-to-b from-blue-900 to-indigo-900 flex flex-col items-center py-6 space-y-6 fixed h-screen z-30">
        <div className="mb-8">
          <span className="text-white font-bold">QWait</span>
        </div>
        
        <nav className="flex-1 space-y-4">
          <Link to="/dashboard" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all group relative">
            <FontAwesomeIcon icon={faHome} className="text-xl" />
            <span className="text-xs">Dashboard</span>
          </Link>

          <Link to="/waitlist" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faUsers} className="text-xl" />
            <span className="text-xs">Waitlist</span>
          </Link>
          
          <Link to="/reservations" className="flex flex-col items-center text-center p-2 text-white bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-xl" />
            <span className="text-xs">Reservations</span>
          </Link>
          
          <Link to="/parties" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faUserFriends} className="text-xl" />
            <span className="text-xs">Parties</span>
          </Link>
          
          <Link to="/recent" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faHistory} className="text-xl" />
            <span className="text-xs">Recent</span>
          </Link>
          
          <Link to="#" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faChartBar} className="text-xl" />
            <span className="text-xs">Analytics</span>
          </Link>
          
          <Link to="#" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faCog} className="text-xl" />
            <span className="text-xs">Settings</span>
          </Link>
        </nav>
        
        <div className="mt-auto">
          <Link to="/logout" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
            <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
            <span className="text-xs">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} - Reservations</h1>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reservations..."
                  className="pl-10 pr-4 py-2 border rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
              </div>
              
              {/* Add Reservation Button */}
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                onClick={openAddModal}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Reservation
              </button>
            </div>
          </div>
        </header>

        {/* Reservations Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with search and add button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <input 
                type="text" 
                placeholder="Search by name, phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-lg px-4 py-2 w-64 mr-4"
              />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-4 py-2"
              />
            </div>
            <button onClick={openAddModal} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Reservation
            </button>
          </div>

          {/* Reservations List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : getFilteredReservations().length > 0 ? (
            <div> {/** Single container for the selected date's reservations **/} 
              <h2 className={`text-xl font-semibold mb-4 ${isToday(selectedDate) ? 'text-blue-600' : 'text-gray-800'}`}>
                Reservations for: {formatDate(selectedDate)}
                {isToday(selectedDate) && ' (Today)'}
              </h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredReservations().map(reservation => (
                      <tr key={reservation.id} className={reservation.checked_in ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dateFns.format(new Date(`${reservation.date}T${reservation.time}`), 'p')} {/** Format time **/} 
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {reservation.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reservation.party_size}
                        </td>
                        <td className="px-6 py-4">
                          <div>{reservation.phone}</div>
                          {/* email removed */}
                        </td>
                        <td className="px-6 py-4">
                          {reservation.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${reservation.checked_in ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reservation.checked_in ? 'Checked In' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {!reservation.checked_in && (
                            <button
                              onClick={() => handleCheckIn(reservation.id)}
                              className="text-green-600 hover:text-green-900 mr-2"
                              title="Check In"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(reservation)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(reservation.id, reservation.date)} // Pass date for reload logic
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-4xl mb-4" />
              <p className="text-gray-600">No reservations found for {formatDate(selectedDate)}.</p>
              <p className="text-sm text-gray-500">Try selecting a different date or adding a new reservation.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{modalTitle}</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={formValues.phone}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                  <select
                    id="party_size"
                    name="party_size"
                    value={formValues.party_size}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input 
                    type="date" 
                    id="date"
                    name="date"
                    value={formValues.date}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input 
                    type="time" 
                    id="time"
                    name="time"
                    value={formValues.time}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea 
                    id="notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={handleInputChange}
                    className="border rounded-lg px-4 py-2 w-full h-24"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (isEdit ? 'Update Reservation' : 'Add Reservation')}
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

export default Reservations; 