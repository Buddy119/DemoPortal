import React from 'react';

export default function ModeSelector({ currentMode, onModeChange }) {
  return (
    <div className="flex gap-2">
      <button
        className={`px-4 py-2 rounded ${
          currentMode === 'normal'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        onClick={() => onModeChange('normal')}
      >
        Normal Mode
      </button>
      <button
        className={`px-4 py-2 rounded ${
          currentMode === 'agent'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        onClick={() => onModeChange('agent')}
      >
        Agent Mode
      </button>
    </div>
  );
}
