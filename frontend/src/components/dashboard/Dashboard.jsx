import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { logout } from '../../services/authService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurantName, setRestaurantName] = useState('Restaurant Name');
  const [queueCount, setQueueCount] = useState(0);
  const [servedCount, setServedCount] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  
  // Mock data - in a real app this would come from an API
  useEffect(() => {
    // Simulate API call
    setRestaurantName('Swami\'s Restaurant');
    setQueueCount(12);
    setServedCount(45);
    setReservationCount(8);
    
    // Mock recent entries
    setRecentEntries([
      { id: 1, customerName: 'John Smith', status: 'SERVED', timestamp: '18:30', peopleCount: 4 },
      { id: 2, customerName: 'Emily Davis', status: 'WAITING', timestamp: '18:45', peopleCount: 2 },
      { id: 3, customerName: 'Michael Brown', status: 'SERVED', timestamp: '19:00', peopleCount: 3 },
      { id: 4, customerName: 'Sarah Johnson', status: 'SERVED', timestamp: '19:15', peopleCount: 5 },
      { id: 5, customerName: 'David Wilson', status: 'CANCELLED', timestamp: '19:30', peopleCount: 2 },
    ]);
  }, []);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        console.log('Logout successful, redirecting to login');
        navigate('/login');
      } else {
        console.error('Logout failed:', result.message);
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
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
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <i className="fas fa-users mr-2"></i>{queueCount} in queue
              </span>
              <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-200">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <i className="fas fa-user-clock text-blue-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Wait Time</p>
                  <p className="text-2xl font-bold">45 min</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Served Today</p>
                  <p className="text-2xl font-bold">{servedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <i className="fas fa-calendar-check text-purple-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reservations</p>
                  <p className="text-2xl font-bold">{reservationCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full">
                <tbody className="divide-y">
                  {recentEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`${entry.status === 'SERVED' ? 'text-green-600' : entry.status === 'WAITING' ? 'text-blue-600' : 'text-red-600'} mr-4`}>
                            <i className={`fas fa-${entry.status === 'SERVED' ? 'check-circle' : entry.status === 'WAITING' ? 'hourglass-half' : 'times-circle'}`}></i>
                          </span>
                          <div>
                            <p className="font-medium">{entry.customerName}</p>
                            <p className="text-sm text-gray-600">{entry.timestamp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {entry.peopleCount} people
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 