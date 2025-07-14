import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Set to 300 or 500 to debounce streaming updates. Keep 0 to disable.
const STREAM_DEBOUNCE_MS = 0;

function autoExpand(el, maxRows = 6) {
  if (!el) return;
  el.style.height = 'auto';
  const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10);
  const maxHeight = lineHeight * maxRows;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

const ChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you with HSBC APIs today?', raw: '' },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  
  // AbortController for managing streaming requests
  const eventRef = useRef(null);
  const messagesRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const pendingTokensRef = useRef('');

  useEffect(() => {
    return () => {
      if (eventRef.current) {
        if (typeof eventRef.current.abort === 'function') {
          eventRef.current.abort();
        } else if (typeof eventRef.current.close === 'function') {
          eventRef.current.close();
        }
      }
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      const el = messagesRef.current;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      if (atBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input;
    const botIndex = messages.length + 1;
    setMessages((msgs) => [
      ...msgs,
      { sender: 'user', text: userMessage },
      { sender: 'bot', text: '', raw: '' },
    ]);
    setInput('');
    setIsLoading(true);

    if (eventRef.current) {
      eventRef.current.abort();
    }

    if (mode === 'agent') {
      const controller = new AbortController();
      eventRef.current = controller;

      fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, mode, stream: true }),
        signal: controller.signal,
      })
        .then((resp) => {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const decode = (str) => str.replace(/\\n/g, '\n');

          const flushPending = () => {
            if (pendingTokensRef.current) {
              const pending = decode(pendingTokensRef.current);
              pendingTokensRef.current = '';
              setMessages((msgs) =>
                msgs.map((m, idx) =>
                  idx === botIndex ? { ...m, raw: (m.raw || '') + pending } : m
                )
              );
            }
          };

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                flushPending();
                setIsLoading(false);
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              let lines = buffer.split(/\r?\n/);
              buffer = lines.pop();
              for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                // Slice off the leading "data: " prefix while preserving
                // any intentional whitespace in the token itself.
                const data = decode(line.slice(6));
                if (data === '[DONE]') {
                  flushPending();
                  setIsLoading(false);
                  controller.abort();
                  setMessages((msgs) =>
                    msgs.map((m, idx) =>
                      idx === botIndex ? { ...m, text: m.raw, raw: '' } : m
                    )
                  );
                  return;
                }
                if (STREAM_DEBOUNCE_MS > 0) {
                  pendingTokensRef.current += data;
                  clearTimeout(debounceTimeoutRef.current);
                  debounceTimeoutRef.current = setTimeout(
                    flushPending,
                    STREAM_DEBOUNCE_MS
                  );
                } else {
                  setMessages((msgs) =>
                    msgs.map((m, idx) =>
                      idx === botIndex
                        ? { ...m, raw: (m.raw || '') + data }
                        : m
                    )
                  );
                }
              }
              read();
            });
          };

          read();
        })
        .catch((err) => {
          console.error('Streaming error occurred', err);
          setIsLoading(false);
        });
    } else {
      fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, mode }),
      })
        .then((resp) => resp.json())
        .then((data) => {
          setIsLoading(false);
          setMessages((msgs) =>
            msgs.map((m, idx) =>
              idx === botIndex ? { ...m, text: data.message, raw: '' } : m
            )
          );
        })
        .catch((err) => {
          console.error('Request error', err);
          setIsLoading(false);
        });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Chat Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chat Assistant</h2>
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-gray-700 p-1">
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  mode === 'normal'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setMode('normal')}
              >
                Normal
              </button>
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  mode === 'agent'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setMode('agent')}
              >
                Agent
              </button>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          ref={messagesRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" 
          style={{ height: 'calc(100% - 140px)' }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.sender === 'bot' ? (
                    msg.text ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <MarkdownRenderer
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              if (!inline && match && match[1] === 'mermaid') {
                                return (
                                  <code className="language-mermaid mermaid">
                                    {String(children).replace(/\n$/, '')}
                                  </code>
                                );
                              }
                              return !inline ? (
                                <div className="relative">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(String(children))}
                                    className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-200"
                                  >
                                    Copy
                                  </button>
                                  <SyntaxHighlighter language={match ? match[1] : ''} PreTag="div" {...props}>
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-gray-600 px-1 rounded">{children}</code>
                              );
                            },
                          }}
                        >
                          {msg.text}
                        </MarkdownRenderer>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">{msg.raw}</pre>
                    )
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => autoExpand(e.target, 4)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 max-h-24"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;