import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// the global `io` is loaded from socket.io.min.js
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:8000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from WebSocket');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (payload) => {
    if (socketRef.current) {
      socketRef.current.emit('user_message', payload);
    }
  };

  const subscribeToResponses = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('bot_response', handler);
    return () => socketRef.current.off('bot_response', handler);
  };

  const value = { sendMessage, subscribeToResponses, connected };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
