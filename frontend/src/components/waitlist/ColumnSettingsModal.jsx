import React from 'react';

const ColumnSettingsModal = ({ 
  showColumnModal, 
  closeColumnModal, 
  columnSelections, 
  handleColumnSelectionChange, 
  handleColumnSettingsSubmit 
}) => {
  if (!showColumnModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">Column Settings</h3>
          <button onClick={closeColumnModal} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleColumnSettingsSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-xl font-medium">Visible Columns</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="column_arrival_time"
                  checked={columnSelections.includes('arrival_time')}
                  onChange={() => handleColumnSelectionChange('arrival_time')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="column_arrival_time" className="ml-2 text-gray-700">
                  Arrival Time
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="column_notes"
                  checked={columnSelections.includes('notes')}
                  onChange={() => handleColumnSelectionChange('notes')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="column_notes" className="ml-2 text-gray-700">
                  Notes
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="column_status"
                  checked={columnSelections.includes('status')}
                  onChange={() => handleColumnSelectionChange('status')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="column_status" className="ml-2 text-gray-700">
                  Status
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={closeColumnModal}
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

export default ColumnSettingsModal; 