import React from 'react';

const Header = ({ 
  restaurantName, 
  queueCount, 
  openQRModal,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  openColumnModal 
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800">{restaurantName} Waitlist</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm ml-3">
            <i className="fas fa-users mr-2"></i>{queueCount} waiting
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openQRModal} 
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <i className="fas fa-qrcode mr-2"></i>
            Show QR Code
          </button>
        </div>
      </div>
    
      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search names, phones, notes..." 
                className="px-4 py-2 pl-10 pr-10 border rounded-lg w-64" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              {searchTerm && (
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" 
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600"></i>
                </div>
              )}
            </div>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Waiting</option>
              <option>Notified</option>
            </select>
            <button 
              onClick={openColumnModal} 
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <i className="fas fa-columns mr-2"></i>Columns
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 