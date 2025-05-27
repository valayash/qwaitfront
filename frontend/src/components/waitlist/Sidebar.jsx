import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ handleLogout }) => {
  return (
    <aside className="w-20 bg-gradient-to-b from-blue-900 to-indigo-900 flex flex-col items-center py-6 space-y-6 fixed h-screen z-30">
      <div className="mb-8">
        <span className="text-white font-bold">QWait</span>
      </div>
      
      <nav className="flex-1 space-y-4">
        <Link to="/dashboard" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all group relative">
          <i className="fas fa-home text-xl"></i>
          <span className="text-xs">Dashboard</span>
        </Link>
        
        <Link to="/waitlist" className="flex flex-col items-center text-center p-2 text-white bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-users text-xl"></i>
          <span className="text-xs">Waitlist</span>
        </Link>
        
        <Link to="/reservations" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-calendar-alt text-xl"></i>
          <span className="text-xs">Reservations</span>
        </Link>
        
        <Link to="/parties" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-user-friends text-xl"></i>
          <span className="text-xs">Parties</span>
        </Link>
        
        <Link to="/recent" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-history text-xl"></i>
          <span className="text-xs">Recent</span>
        </Link>
        
        <Link to="/analytics" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-chart-bar text-xl"></i>
          <span className="text-xs">Analytics</span>
        </Link>
        
        <Link to="/settings" className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-cog text-xl"></i>
          <span className="text-xs">Settings</span>
        </Link>
      </nav>
      
      <div className="mt-auto">
        <button onClick={handleLogout} className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative">
          <i className="fas fa-sign-out-alt text-xl"></i>
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 