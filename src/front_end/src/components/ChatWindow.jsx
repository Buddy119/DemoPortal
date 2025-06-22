function MessageCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-message-circle"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function MinusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-minus"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useSocket } from '../SocketProvider.jsx';
import { useElementHighlight } from '../hooks/useElementHighlight.js';

export default function ChatWindow() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can we assist you?' },
  ]);
  const [input, setInput] = useState('');
  const { sendMessage, subscribeToResponses } = useSocket();
  const { highlight } = useElementHighlight();
  const messagesRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToResponses((data) => {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.responseText }]);
      if (data.highlightSelector) {
        highlight(data.highlightSelector);
      }
    });
    return unsubscribe;
  }, [subscribeToResponses, highlight]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    const payload = {
      context: {
        currentPage: 'User Authentication API',
        selectedLanguage: 'curl',
        previousQueries: [],
      },
      userQuery: input,
    };
    sendMessage(payload);
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }]);
    setInput('');
  };

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
            <MinusIcon width={16} height={16} />
          </button>
        </div>
        <div
          ref={messagesRef}
          className="p-2 overflow-y-auto space-y-2 flex-1 h-96 scrollbar-hide"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`max-w-xs text-sm rounded-lg p-2 break-words ${
                  m.sender === 'bot'
                    ? 'bg-gray-100 text-gray-800 self-start'
                    : 'bg-blue-100 self-end'
                }`}
              >
                {m.sender === 'bot' ? (
                  <div className="prose prose-sm">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 text-sm">{children}</p>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 px-1 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto text-sm">
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {children}
                          </a>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5">{children}</ol>
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 border-t p-2">
          <input
            className="flex-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
      {!open && (
        <button
          className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
          onClick={() => setOpen(true)}
        >
          <MessageCircleIcon width={20} height={20} />
        </button>
      )}
    </>
  );
}
