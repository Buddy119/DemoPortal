import React, { useRef, useEffect, useCallback } from 'react';

const ResizeHandle = ({ onResize, onStart, onStop, isActive }) => {
  const handleRef = useRef(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  
  // Store callbacks in refs to avoid recreating event listeners
  const onResizeRef = useRef(onResize);
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  
  // Update refs when props change
  useEffect(() => {
    onResizeRef.current = onResize;
    onStartRef.current = onStart;
    onStopRef.current = onStop;
  }, [onResize, onStart, onStop]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 0) {
      onResizeRef.current?.(deltaX);
      startXRef.current = e.clientX;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    onStopRef.current?.();
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    onStartRef.current?.();
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handle = handleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', handleMouseDown, { passive: false });
    }

    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', handleMouseDown);
      }
      // Cleanup any remaining global listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={handleRef}
      className={`w-2 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-all duration-200 relative group flex-shrink-0 select-none ${
        isActive ? 'bg-blue-500 w-3' : ''
      }`}
      style={{ zIndex: 20 }}
      title="Drag to resize columns"
    >
      {/* Wider invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-4 -right-4 cursor-col-resize" />
      
      {/* Visual indicator on hover - three dots pattern */}
      <div className="absolute inset-y-0 left-0 right-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="flex flex-col space-y-1">
          <div className="w-0.5 h-0.5 bg-white opacity-80 rounded-full" />
          <div className="w-0.5 h-0.5 bg-white opacity-80 rounded-full" />
          <div className="w-0.5 h-0.5 bg-white opacity-80 rounded-full" />
        </div>
      </div>
      
      {/* Active state indicator */}
      {isActive && (
        <div className="absolute inset-y-0 left-0 right-0 bg-blue-400 flex items-center justify-center">
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-white opacity-90 rounded-full" />
            <div className="w-1 h-1 bg-white opacity-90 rounded-full" />
            <div className="w-1 h-1 bg-white opacity-90 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResizeHandle;