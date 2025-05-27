import React from 'react';

const QRCodeModal = ({ showQRModal, closeQRModal, restaurantName, qrCodeURL, joinURL, copyJoinLink }) => {
  if (!showQRModal) return null;
  
  // Check if QR code is available
  const isQRCodeAvailable = qrCodeURL && qrCodeURL.startsWith('data:image');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{restaurantName} Waitlist QR</h3>
          <button onClick={closeQRModal} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center p-4">
          {isQRCodeAvailable ? (
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <img src={qrCodeURL} alt="QR Code for Joining Queue" className="w-60 h-60 object-contain" />
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-4 w-60 h-60 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="mb-2">QR Code not available</p>
                <p className="text-sm">Please try again later</p>
              </div>
            </div>
          )}
          
          <div className="w-full mb-4">
            <label htmlFor="join-link" className="block text-sm font-medium text-gray-700 mb-1">Share this link:</label>
            <div className="flex">
              <input 
                type="text" 
                readOnly 
                value={joinURL || "Link not available"} 
                id="join-link" 
                className="flex-1 px-3 py-2 bg-gray-50 border rounded-l-lg focus:outline-none"
              />
              <button 
                onClick={copyJoinLink}
                disabled={!joinURL} 
                className={`px-3 py-2 rounded-r-lg ${joinURL ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mb-4">
            {isQRCodeAvailable 
              ? "Scan this QR code or share the link to join your restaurant's waitlist"
              : "QR code generation failed. Please check your backend configuration."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 