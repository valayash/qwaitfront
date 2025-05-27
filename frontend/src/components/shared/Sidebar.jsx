import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faCalendarAlt,
  faUserFriends,
  faHistory,
  faChartBar,
  faCog,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ handleLogout, currentPath }) => {
  return (
    <aside className="w-20 bg-gradient-to-b from-blue-900 to-indigo-900 flex flex-col items-center py-6 space-y-6 fixed h-screen z-30">
      <div className="mb-8">
        <span className="text-white font-bold">QWait</span>
      </div>
      
      <nav className="flex-1 space-y-4">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/dashboard' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faHome} className="text-xl" />
          <span className="text-xs">Dashboard</span>
        </Link>

        <Link 
          to="/waitlist" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/waitlist' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faUsers} className="text-xl" />
          <span className="text-xs">Waitlist</span>
        </Link>
        
        <Link 
          to="/reservations" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/reservations' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faCalendarAlt} className="text-xl" />
          <span className="text-xs">Reservations</span>
        </Link>
        
        <Link 
          to="/parties" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/parties' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faUserFriends} className="text-xl" />
          <span className="text-xs">Parties</span>
        </Link>
        
        <Link 
          to="/recent" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/recent' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faHistory} className="text-xl" />
          <span className="text-xs">Recent</span>
        </Link>
        
        <Link 
          to="/analytics" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/analytics' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faChartBar} className="text-xl" />
          <span className="text-xs">Analytics</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`flex flex-col items-center text-center p-2 text-white rounded-lg transition-all duration-200 group relative ${
            currentPath === '/settings' ? 'bg-blue-800' : 'hover:bg-blue-800'
          }`}
        >
          <FontAwesomeIcon icon={faCog} className="text-xl" />
          <span className="text-xs">Settings</span>
        </Link>
      </nav>
      
      <div className="mt-auto">
        <button 
          onClick={handleLogout} 
          className="flex flex-col items-center text-center p-2 text-white hover:bg-blue-800 rounded-lg transition-all duration-200 group relative"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 