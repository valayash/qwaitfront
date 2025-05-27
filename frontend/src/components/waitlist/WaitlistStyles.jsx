import React from 'react';

const WaitlistStyles = () => {
  return (
    <style>
      {`
        table {
          border-collapse: separate;
          border-spacing: 0;
        }
        th {
          position: sticky;
          top: 0;
          background: #f9fafb;
          z-index: 10;
          box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.1);
        }
        
        @keyframes fadeIn {
          from { opacity: 0.7; background-color: #ebf5ff; }
          to { opacity: 1; background-color: transparent; }
        }
        
        @keyframes pulseOnce {
          0% { background-color: transparent; }
          50% { background-color: #f0f9ff; }
          100% { background-color: transparent; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
        
        .animate-pulse-once {
          animation: pulseOnce 1s ease-in-out;
        }
      `}
    </style>
  );
};

export default WaitlistStyles; 