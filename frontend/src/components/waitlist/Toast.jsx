import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  const bgColor = 
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${bgColor} flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast; 