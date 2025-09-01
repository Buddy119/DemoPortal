import { useState, useCallback, useEffect, useRef } from 'react';

// Default and constraint values for chat panel width
const DEFAULT_WIDTH = 384; // 24rem (sm:w-96 equivalent)
const MIN_WIDTH = 320; // 20rem
const MAX_WIDTH = 800; // 50rem
const STORAGE_KEY = 'hsbc-chat-panel-width';

/**
 * Custom hook for managing resizable chat panel
 * Provides horizontal resizing functionality with width persistence
 */
export const useResizableChat = () => {
  // Load initial width from localStorage or use default
  const getInitialWidth = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const width = parseInt(saved, 10);
          return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
        } catch (e) {
          console.warn('Failed to parse saved chat panel width:', e);
        }
      }
    }
    return DEFAULT_WIDTH;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save width to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [width]);

  // Mouse move handler for resizing
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = startXRef.current - e.clientX; // Negative delta = expand right to left
    const newWidth = Math.max(
      MIN_WIDTH,
      Math.min(MAX_WIDTH, startWidthRef.current + deltaX)
    );
    
    setWidth(newWidth);
  }, [isDragging]);

  // Mouse up handler to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Start resize operation
  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // Reset to default width
  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    width,
    isDragging,
    startResize,
    resetWidth,
    constraints: {
      min: MIN_WIDTH,
      max: MAX_WIDTH,
      default: DEFAULT_WIDTH
    }
  };
};