import React from 'react';

const WaitlistTable = ({ 
  error, 
  loading,
  waitlistEntries, 
  filteredEntries, 
  visibleColumns,
  openAddModal,
  openQRModal,
  openEditModal,
  handleStatusChange,
  handleRemove
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-blue-500 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading waitlist data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-400"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!waitlistEntries || waitlistEntries.length === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-400"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">No entries in the waitlist. Add a party to get started!</p>
            <button 
              onClick={openAddModal} 
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Add Party
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
            {visibleColumns.includes('arrival_time') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Time</th>
            )}
            {visibleColumns.includes('notes') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Duration</th>
            {visibleColumns.includes('status') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(filteredEntries || waitlistEntries).map((entry) => (
            <tr 
              key={entry.id} 
              className={`hover:bg-gray-50 ${entry.isNew ? 'bg-green-50' : entry.isUpdated ? 'bg-yellow-50' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{entry.customerName}</div>
                    <div className="text-sm text-gray-500">{entry.phoneNumber}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{entry.peopleCount}</div>
              </td>
              {visibleColumns.includes('arrival_time') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.timestamp}</div>
                </td>
              )}
              {visibleColumns.includes('notes') && (
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{entry.notes || '-'}</div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{entry.waitTimeMinutes} min</div>
              </td>
              {visibleColumns.includes('status') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {entry.status}
                  </span>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => openEditModal(entry)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleStatusChange(entry.id, 'SERVED')}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  Serve
                </button>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WaitlistTable; 