import React from 'react';
import { MessageCircle, Minus } from 'lucide-react';

export default function ChatWindow() {
  const [open, setOpen] = React.useState(true);

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 w-72 bg-white border rounded shadow-lg flex flex-col transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <div className="flex justify-between items-center border-b p-2">
          <span className="font-semibold">Chat</span>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setOpen(false)}
          >
            <Minus size={16} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto space-y-2" style={{ maxHeight: '300px' }}>
          <div className="text-sm bg-gray-100 rounded p-2 w-fit">Hello! How can we assist you?</div>
          <div className="text-sm bg-blue-100 rounded p-2 w-fit self-end">This is a placeholder message.</div>
          <div className="text-sm bg-gray-100 rounded p-2 w-fit">Feel free to ask us anything.</div>
          <div className="text-sm bg-blue-100 rounded p-2 w-fit self-end">More features coming soon!</div>
        </div>
      </div>
      {!open && (
        <button
          className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
          onClick={() => setOpen(true)}
        >
          <MessageCircle size={20} />
        </button>
      )}
    </>
  );
}
