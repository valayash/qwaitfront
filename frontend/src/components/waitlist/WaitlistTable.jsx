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
  handleRemove,
  isActionLoading
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
                  {typeof entry.position === 'number' && (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <span className="text-blue-700 font-semibold">{entry.position}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-medium text-gray-900">{entry.customerName}</div>
                    <div className="text-sm text-gray-500">{entry.phoneNumber}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  {entry.peopleCount} {entry.peopleCount === 1 ? 'person' : 'people'}
                </span>
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
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mr-2 transition duration-150 ease-in-out"
                  title="Edit Party"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button
                  onClick={() => handleStatusChange(entry.id, 'SERVED')}
                  className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mr-2 transition duration-150 ease-in-out"
                  title="Serve Party"
                >
                  <i className="fas fa-check"></i>
                </button>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                  title="Remove Party"
                >
                  <i className="fas fa-times"></i>
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