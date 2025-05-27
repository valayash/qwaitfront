import React from 'react';

const EditPartyModal = ({ 
  showEditModal, 
  closeEditModal, 
  selectedEntry,
  editFormData, 
  handleEditInputChange, 
  handleEditSizeSelect, 
  adjustEditQuotedTime, 
  handleEditPartySubmit 
}) => {
  if (!showEditModal || !selectedEntry) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl relative z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">Edit party</h3>
          <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleEditPartySubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Phone Section */}
            <div className="space-y-2">
              <label className="block text-xl font-medium">Phone</label>
              <div className="flex gap-2">
                <input 
                  type="tel" 
                  name="phone_number" 
                  required 
                  value={editFormData.phone_number}
                  onChange={handleEditInputChange}
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" className="p-2 bg-gray-50 rounded-lg">
                  <i className="fas fa-comment-alt text-gray-600"></i>
                </button>
              </div>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
              <label className="block text-xl font-medium">Name</label>
              <input 
                type="text" 
                name="customer_name" 
                required 
                value={editFormData.customer_name}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Size Section */}
          <div className="space-y-2">
            <label className="block text-xl font-medium">Size</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                <button 
                  key={size}
                  type="button" 
                  onClick={() => handleEditSizeSelect(size)}
                  className={`size-btn w-12 h-12 flex items-center justify-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editFormData.people_count === size.toString() ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                >
                  {size}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => handleEditSizeSelect(8)}
                className={`size-btn w-20 h-12 flex items-center justify-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  editFormData.people_count === '8' ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
              >
                8+
              </button>
            </div>
            <input type="hidden" name="people_count" value={editFormData.people_count} required />
          </div>

          {/* Quoted Time Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xl font-medium">Quoted Time</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  name="quoted_time" 
                  value={editFormData.quoted_time}
                  onChange={handleEditInputChange}
                  min="5" 
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg"
                />
                <button 
                  type="button" 
                  onClick={() => adjustEditQuotedTime(5)}
                  className="w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                >
                  +5
                </button>
                <button 
                  type="button" 
                  onClick={() => adjustEditQuotedTime(-5)}
                  className="w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                >
                  -5
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="block text-xl font-medium">Notes</label>
              <textarea 
                name="notes" 
                rows={1}
                value={editFormData.notes}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={closeEditModal}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPartyModal; 