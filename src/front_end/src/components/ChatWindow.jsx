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
import ModeSelector from './ModeSelector.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// SSE streaming does not rely on the existing WebSocket utilities

// Set to 300 or 500 to debounce streaming updates. Keep 0 to disable.
const STREAM_DEBOUNCE_MS = 0;

function autoExpand(el, maxRows = 6) {
  if (!el) return;
  el.style.height = 'auto';
  const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10);
  const maxHeight = lineHeight * maxRows;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

export default function ChatWindow() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can we assist you?', raw: '' },
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
  }, [messages, open]);

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
                const data = decode(line.slice(5).trim());
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

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 w-full md:max-w-2xl bg-white border rounded shadow-lg flex flex-col transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <div className="flex justify-between items-center border-b p-2">
          <span className="font-semibold">Chat</span>
          <div className="flex items-center gap-2">
            <ModeSelector currentMode={mode} onModeChange={setMode} />
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setOpen(false)}
            >
              <MinusIcon width={16} height={16} />
            </button>
          </div>
        </div>
        <div
          ref={messagesRef}
          className="flex flex-col h-[70vh] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent px-4 space-y-3"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`rounded-lg p-3 max-w-[90%] ${
                  m.sender === 'bot'
                    ? 'self-start bg-gray-100 text-gray-900 prose prose-sm'
                    : 'self-end bg-blue-100 text-blue-900'
                }`}
              >
                {m.sender === 'bot' ? (
                  m.text ? (
                    <MarkdownRenderer
                      components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <div className="relative">
                              <button
                                onClick={() => navigator.clipboard.writeText(String(children))}
                                className="absolute top-2 right-2 text-xs text-gray-600 hover:text-gray-800"
                              >
                                Copy
                              </button>
                              <SyntaxHighlighter language={match ? match[1] : ''} PreTag="div" {...props}>
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-gray-200 px-1 rounded">{children}</code>
                          );
                        },
                      }}
                    >
                      {m.text}
                    </MarkdownRenderer>
                  ) : (
                    <pre className="whitespace-pre-wrap">{m.raw}</pre>
                  )
                ) : (
                  m.text
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 border-t p-2 md:flex-row md:items-end">
          <textarea
            rows={1}
            className="flex-1 resize-none rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => autoExpand(e.target, 6)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSend}
            disabled={!input.trim()}
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
