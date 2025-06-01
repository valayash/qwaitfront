import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQueueConfirmationDetails, leaveQueue } from '../../services/customerQueueService';

const QueueConfirmation = () => {
  const { restaurantId, queueEntryId } = useParams();
  const navigate = useNavigate();
  
  const [queueEntry, setQueueEntry] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  
  useEffect(() => {
    const fetchQueueConfirmation = async () => {
      try {
        setLoading(true);
        
        if (!restaurantId || !queueEntryId) {
          setError('Missing queue information');
          setLoading(false);
          return;
        }
        
        // Fetch queue entry details
        const data = await getQueueConfirmationDetails(restaurantId, queueEntryId);
        
        if (data && data.success) {
          setQueueEntry(data.queue_entry || {});
          setQueuePosition(data.position || 0);
          setEstimatedWaitTime(data.estimated_wait_time || 0);
        } else {
          setError('Failed to load queue information');
        }
      } catch (error) {
        console.error('Error fetching queue confirmation:', error);
        setError('Could not load queue information. The entry may have been removed or already served.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQueueConfirmation();
    
    // Set up polling to refresh the data every 30 seconds
    // const intervalId = setInterval(fetchQueueConfirmation, 30000); // Commented out polling
    
    // Clean up on component unmount
    // return () => clearInterval(Number(intervalId)); // Commented out cleanup for polling
  }, [restaurantId, queueEntryId]);
  
  const handleRemoveFromQueue = async () => {
    if (!queueEntryId) {
      setError('Missing queue entry information');
      return;
    }
    
    if (window.confirm('Are you sure you want to remove yourself from the queue?')) {
      try {
        setRemoving(true);
        
        const result = await leaveQueue(restaurantId, queueEntryId);
        
        if (result.success) {
          alert('You have been removed from the queue');
          if (result.redirect_url_segment) {
            navigate(`/c/${result.redirect_url_segment}`);
          } else if (restaurantId) {
            navigate(`/join-queue/${restaurantId}/`);
          } else {
            navigate('/');
          }
        } else {
          setError('Failed to remove from queue');
          setRemoving(false);
        }
      } catch (error) {
        console.error('Error removing from queue:', error);
        setError(error.message || 'Failed to remove from queue');
        setRemoving(false);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading queue information...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
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
            <Link 
              to={`/join-queue/${restaurantId}/`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Join Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!queueEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center text-yellow-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-4">Entry Not Found</h2>
          <p className="text-center text-gray-700">The queue entry could not be found. It may have been removed or already served.</p>
          <div className="mt-6 text-center">
            <Link 
              to={`/join-queue/${restaurantId}/`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Join Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 bg-blue-50 border-b text-center">
            <div className="mb-2 flex justify-center text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome to {queueEntry?.restaurant?.name || 'Restaurant'}!</h1>
            <p className="text-gray-600 mt-1">Your Party is in the Queue</p>
          </div>
          
          {/* Queue Status */}
          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your position</p>
                    <p className="text-xl font-bold text-gray-800">{queuePosition}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated time</p>
                    <p className="text-xl font-bold text-gray-800">{estimatedWaitTime}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    We'll notify you when your table is ready. Please stay in the area or keep your phone handy.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Party Details */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Your Party Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{queueEntry?.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{queueEntry?.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Party Size:</span>
                  <span className="font-medium">{queueEntry?.people_count} people</span>
                </div>
                {queueEntry?.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notes:</span>
                    <span className="font-medium">{queueEntry?.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <button
              onClick={handleRemoveFromQueue}
              disabled={removing}
              className={`w-full ${
                removing ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
              } text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center`}
            >
              {removing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Remove from Queue
                </>
              )}
            </button>
          </div>
          
          {/* Info Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-gray-600">{queueEntry?.restaurant?.address || 'Restaurant Location'}</span>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-sm text-gray-600">{queueEntry?.restaurant?.phone || ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueConfirmation; 