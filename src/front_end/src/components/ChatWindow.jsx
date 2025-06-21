import React from 'react';

export default function ChatWindow() {
  const [open, setOpen] = React.useState(true);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white border rounded shadow-lg flex flex-col">
      <div className="flex justify-between items-center border-b p-2">
        <span className="font-semibold">Chat</span>
        <button className="text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="p-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
        <p className="text-sm text-gray-500">Chat content coming soon...</p>
      </div>
    </div>
  );
}
