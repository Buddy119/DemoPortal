import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FlowsSidebar = ({ isOpen, onClose }) => {
  const [selectedFlow, setSelectedFlow] = useState('Un-registered [Web]');

  const flows = [
    'Un-registered [Web]',
    'Un-registered [Mobile]',
    'Signed Up [Web]'
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-full sm:w-64 bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Flows</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {flows.map((flow) => (
              <button
                key={flow}
                onClick={() => setSelectedFlow(flow)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFlow === flow
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {flow}
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">No description</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlowsSidebar;