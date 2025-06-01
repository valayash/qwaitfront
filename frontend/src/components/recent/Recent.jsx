import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as dateFns from 'date-fns';
/*
import {
  fetchRecentActivity,
  undoAction,
} from '../../services/recentActivityService';
*/
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
  faCheck,
  faTimes,
  faUndoAlt
} from '@fortawesome/free-solid-svg-icons';
import './Recent.css';
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

const Recent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // State for recent activity data
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [toast, setToast] = useState(null);
  
  // Load recent activity data on component mount
  useEffect(() => {
    loadRecentActivity();
  }, []);
  
  // Function to show toast messages
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  
  // Function to hide toast
  const hideToast = () => {
    setToast(null);
  };
  
  // Load recent activity data from the API
  const loadRecentActivity = async () => {
    setIsLoading(true);
    try {
      // const data = await fetchRecentActivity();
      // setRestaurantName(data.restaurant.name);
      // setRecentEntries(data.recent_entries);
      setRestaurantName('Restaurant'); // Placeholder
      setRecentEntries([]); // Placeholder
      showToast('Recent activity fetching is currently disabled.', 'warning');
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      showToast('Failed to load recent activity', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle undo action
  const handleUndo = async (entryId) => {
    if (!window.confirm('Are you sure you want to undo this action?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // const response = await undoAction(entryId);
      const response = { success: false, message: 'Undo action is currently disabled.' }; // Placeholder
      
      if (response.success) {
        showToast('Action undone successfully', 'success');
        loadRecentActivity();
      } else {
        showToast(response.message || 'Failed to undo action', 'error');
      }
    } catch (error) {
      console.error('Error undoing action:', error);
      showToast('Failed to undo action', 'error');
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
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} Recent Activity</h1>
          </div>
        </header>

        {/* Recent Activity Content */}
        <div className="p-6">
          {recentEntries.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-200px)]">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Undo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {recentEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span 
                              className={`
                                rounded-full h-8 w-8 flex items-center justify-center mr-3
                                ${entry.status === 'SERVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              `}
                            >
                              <FontAwesomeIcon icon={entry.status === 'SERVED' ? faCheck : faTimes} />
                            </span>
                            <div className="font-medium">{entry.customer_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`
                              px-2 py-1 rounded-full text-sm
                              ${entry.status === 'SERVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            `}
                          >
                            {entry.status_display}
                          </span>
                          {entry.reversed_status && (
                            <span className="text-xs text-gray-500 ml-2">(From {entry.reversed_status})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {dateFns.format(dateFns.parseISO(entry.timestamp), 'h:mm a MM/dd/yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md"
                            onClick={() => handleUndo(entry.id)}
                          >
                            <FontAwesomeIcon icon={faUndoAlt} className="mr-1" /> Undo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FontAwesomeIcon icon={faHistory} className="text-6xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No recent activity</h2>
              <p className="text-gray-600">Get customers moving!</p>
            </div>
          )}
        </div>
      </main>
      
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

export default Recent; 