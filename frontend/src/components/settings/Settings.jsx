import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faBell,
  faUser,
  faLock,
  faSignOutAlt,
  faSave,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../shared/Sidebar';

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      push: false
    },
    waitlist: {
      maxParties: 50,
      autoRemoveAfter: 120, // minutes
      defaultWaitTime: 30 // minutes
    },
    display: {
      showPhoneNumbers: true,
      showNotes: true,
      showWaitTimes: true
    },
    security: {
      requirePhoneVerification: true,
      twoFactorAuth: false
    }
  });

  const handleLogout = () => {
    navigate('/login');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      showToast('Settings saved successfully');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsLoading(false);
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
            <h1 className="text-xl font-bold text-gray-800">{restaurantName} Settings</h1>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        {/* Settings Content */}
        <div className="p-6">
          {/* Notifications Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faBell} className="text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => handleInputChange('notifications', 'email', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">SMS Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => handleInputChange('notifications', 'sms', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Push Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => handleInputChange('notifications', 'push', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Waitlist Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Waitlist Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Maximum Parties</label>
                <input
                  type="number"
                  value={settings.waitlist.maxParties}
                  onChange={(e) => handleInputChange('waitlist', 'maxParties', parseInt(e.target.value))}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Auto-remove After (minutes)</label>
                <input
                  type="number"
                  value={settings.waitlist.autoRemoveAfter}
                  onChange={(e) => handleInputChange('waitlist', 'autoRemoveAfter', parseInt(e.target.value))}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Default Wait Time (minutes)</label>
                <input
                  type="number"
                  value={settings.waitlist.defaultWaitTime}
                  onChange={(e) => handleInputChange('waitlist', 'defaultWaitTime', parseInt(e.target.value))}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faUser} className="text-purple-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Display Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Show Phone Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.display.showPhoneNumbers}
                  onChange={(e) => handleInputChange('display', 'showPhoneNumbers', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Show Notes</label>
                <input
                  type="checkbox"
                  checked={settings.display.showNotes}
                  onChange={(e) => handleInputChange('display', 'showNotes', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Show Wait Times</label>
                <input
                  type="checkbox"
                  checked={settings.display.showWaitTimes}
                  onChange={(e) => handleInputChange('display', 'showWaitTimes', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faLock} className="text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Require Phone Verification</label>
                <input
                  type="checkbox"
                  checked={settings.security.requirePhoneVerification}
                  onChange={(e) => handleInputChange('security', 'requirePhoneVerification', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Two-Factor Authentication</label>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Settings; 