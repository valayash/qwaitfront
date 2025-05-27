import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUsers,
  faClock,
  faChartBar,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../shared/Sidebar';

const Analytics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const stats = {
    totalCustomers: 1250,
    averageWaitTime: 25,
    peakHours: '6:00 PM - 8:00 PM',
    popularDays: ['Friday', 'Saturday'],
    customerRetention: 75,
    satisfactionRate: 92
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeRange]);

  const handleLogout = () => {
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
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} Analytics</h1>
            <div className="flex space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </header>

        {/* Analytics Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Total Customers */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Total Customers</h3>
                    <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                  <p className="text-sm text-gray-500 mt-2">Last {timeRange}</p>
                </div>

                {/* Average Wait Time */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Average Wait Time</h3>
                    <FontAwesomeIcon icon={faClock} className="text-green-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageWaitTime} min</p>
                  <p className="text-sm text-gray-500 mt-2">Last {timeRange}</p>
                </div>

                {/* Peak Hours */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Peak Hours</h3>
                    <FontAwesomeIcon icon={faChartLine} className="text-purple-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.peakHours}</p>
                  <p className="text-sm text-gray-500 mt-2">Most busy period</p>
                </div>

                {/* Popular Days */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Popular Days</h3>
                    <FontAwesomeIcon icon={faChartBar} className="text-yellow-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.popularDays.join(', ')}</p>
                  <p className="text-sm text-gray-500 mt-2">Busiest days</p>
                </div>

                {/* Customer Retention */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Customer Retention</h3>
                    <FontAwesomeIcon icon={faChartPie} className="text-red-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.customerRetention}%</p>
                  <p className="text-sm text-gray-500 mt-2">Returning customers</p>
                </div>

                {/* Satisfaction Rate */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Satisfaction Rate</h3>
                    <FontAwesomeIcon icon={faChartPie} className="text-indigo-500 text-xl" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.satisfactionRate}%</p>
                  <p className="text-sm text-gray-500 mt-2">Customer satisfaction</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wait Time Trend */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Wait Time Trend</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart will be implemented here</p>
                  </div>
                </div>

                {/* Customer Volume */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Volume</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart will be implemented here</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics; 