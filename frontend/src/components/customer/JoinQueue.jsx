import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurant, joinQueueSubmit, checkPhoneInWaitlist } from '../../services/customerQueueService';

const JoinQueue = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  
  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    // Remove all non-digits
    const digitsOnly = input.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if enough digits
    if (digitsOnly.length >= 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    } else if (digitsOnly.length > 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length > 3) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else if (digitsOnly.length > 0) {
      return `(${digitsOnly}`;
    }
    return '';
  };
  
  // Validate phone number
  const isValidPhoneNumber = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };
  
  useEffect(() => {
    // Fetch restaurant details
    const fetchRestaurant = async () => {
      try {
        if (!restaurantId) {
          console.error('Missing restaurant ID');
          setError('Invalid restaurant ID. Please check the URL.');
          return;
        }
        
        console.log('Fetching restaurant details for ID:', restaurantId);
        const data = await getRestaurant(restaurantId);
        console.log('Restaurant data received:', data);
        
        if (!data || !data.success || !data.restaurant || !data.restaurant.name) {
          console.error('Invalid restaurant data received:', data);
          setError('Could not load restaurant information. Invalid data received.');
          return;
        }
        
        setRestaurant(data.restaurant);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        // Provide more specific error message based on the error
        if (error.response?.status === 404) {
          setError('Restaurant not found. Please check the QR code or URL.');
        } else if (error.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Could not load restaurant information. ' + (error.message || ''));
        }
      }
    };
    
    fetchRestaurant();
  }, [restaurantId]);
  
  const handleCheckPhoneExists = async (phone) => {
    if (phone.replace(/\D/g, '').length < 10) return;
    
    try {
      if (!restaurantId) return;
      const result = await checkPhoneInWaitlist(restaurantId, phone);
      
      if (result.exists) {
        setPhoneExists(true);
        setError('This phone number is already in the waitlist');
      } else {
        setPhoneExists(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error checking phone:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurantId) {
      setError('Missing restaurant information');
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      setPhoneValid(false);
      return;
    }
    
    if (phoneExists) {
      setError('This phone number is already in the waitlist');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get only digits for submission to backend
      const digitsOnlyPhone = phoneNumber.replace(/\D/g, '');
      
      // Create form data
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('phone_number', digitsOnlyPhone);
      formData.append('people_count', String(peopleCount));
      if (notes) {
        formData.append('notes', notes);
      }
      
      // Use joinQueueSubmit instead of joinQueue
      const result = await joinQueueSubmit(restaurantId, formData);
      
      if (result.success && result.queue_entry_id) {
        // Navigate to the confirmation page
        navigate(`/join-queue/${restaurantId}/queue-confirmation/${result.queue_entry_id}/`);
      } else if (result.success) {
        // Navigate back to restaurant home if we don't have a queue_entry_id
        alert('Successfully joined the queue, but could not retrieve the queue entry ID.');
        navigate(`/join-queue/${restaurantId}/`);
      } else {
        setError('Failed to join the queue');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      
      // Attempt to check waitlist to see if the entry was added despite the error
      // This is a backup in case the server adds the entry but returns an error
      try {
        // If we get here and the phone number was already added, we'll redirect to avoid duplicate submissions
        const checkResult = await checkPhoneInWaitlist(restaurantId, phoneNumber);
        if (checkResult.exists) {
          alert('Your entry has been added to the waitlist. Redirecting to home page.');
          navigate(`/join-queue/${restaurantId}/`);
          return;
        }
      } catch (checkError) {
        console.error('Error checking phone after failed submission:', checkError);
      }
      
      // Enhanced error handling
      if (error.data && error.data.errors) {
        const formErrors = error.data.errors;
        
        if (formErrors.phone_number) {
          setError(`Phone number error: ${formErrors.phone_number[0]}`);
          setPhoneValid(false);
        } else if (formErrors.customer_name) {
          setError(`Name error: ${formErrors.customer_name[0]}`);
        } else {
          // Join all error messages into a single string
          const errorMessages = Object.entries(formErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join(', ');
          
          setError(`Form validation failed: ${errorMessages}`);
        }
      } else if (error.status === 400) {
        setError('Please check your form inputs and try again');
      } else if (error.status === 403) {
        setError('Permission denied. The server refused your request.');
      } else if (error.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.message || 'Failed to join the queue');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!restaurant && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading restaurant information...</p>
        </div>
      </div>
    );
  }
  
  if (error && !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-4">Error</h2>
          <p className="text-center text-gray-700">{error}</p>
          <div className="mt-6 text-center">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Restaurant Header */}
          <div className="px-6 py-6 bg-blue-50 border-b">
            <h1 className="text-2xl font-bold text-gray-800">{restaurant?.name || 'Restaurant'}</h1>
            <p className="text-gray-600 mt-1">Join the waiting list</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-white">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* Join Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  id="customer_name" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="phone_number" 
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhoneNumber(formatted);
                      setPhoneValid(isValidPhoneNumber(formatted));
                      
                      if (isValidPhoneNumber(formatted)) {
                        handleCheckPhoneExists(formatted);
                      }
                    }}
                    required
                    placeholder="(123) 456-7890"
                    className={`w-full px-4 py-2 border ${!phoneValid || phoneExists ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {!phoneValid && <p className="text-xs text-red-500 mt-1">Please enter a valid 10-digit phone number</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="people_count" className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <div
                      key={num}
                      onClick={() => setPeopleCount(num)}
                      className={`text-center py-2 border ${
                        peopleCount === num 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'border-gray-300 hover:bg-gray-50'
                      } rounded-lg cursor-pointer`}
                    >
                      {num === 8 ? '8+' : num}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Special Notes (Optional)</label>
                <textarea 
                  id="notes" 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || phoneExists}
                className={`w-full ${
                  loading || phoneExists ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                    </svg>
                    Join Queue
                  </>
                )}
              </button>
            </form>
            
            <p className="mt-4 text-sm text-gray-500 text-center">
              Estimated wait time: <span className="font-medium text-gray-700">15-20 minutes</span>
            </p>
          </div>
          
          {/* Restaurant Info Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-gray-600">{restaurant?.address || 'Restaurant Location'}</span>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-sm text-gray-600">{restaurant?.phone || ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinQueue; 