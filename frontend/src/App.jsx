import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Waitlist from './components/waitlist/Waitlist';
import Reservations from './components/reservations/Reservations';
import Parties from './components/parties/Parties';
import Recent from './components/recent/Recent';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';
import JoinQueue from './components/customer/JoinQueue';
import QueueConfirmation from './components/customer/QueueConfirmation';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/waitlist" element={
          <PrivateRoute>
            <Waitlist />
          </PrivateRoute>
        } />
        
        <Route path="/reservations" element={
          <PrivateRoute>
            <Reservations />
          </PrivateRoute>
        } />
        
        <Route path="/parties" element={
          <PrivateRoute>
            <Parties />
          </PrivateRoute>
        } />
        
        <Route path="/recent" element={
          <PrivateRoute>
            <Recent />
          </PrivateRoute>
        } />
        
        <Route path="/analytics" element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        } />
        
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        
        {/* Customer-facing queue routes - these don't require authentication */}
        <Route path="/join-queue/:restaurantId" element={<JoinQueue />} />
        <Route path="/join-queue/:restaurantId/queue-confirmation/:queueEntryId" element={<QueueConfirmation />} />
      </Routes>
    </Router>
  );
}

export default App; 