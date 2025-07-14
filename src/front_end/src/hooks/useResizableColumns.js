import { useState, useCallback, useEffect } from 'react';

const DEFAULT_WIDTHS = {
  sidebar: 260,
  content: 700,
  codePanel: 400,
};

const CONSTRAINTS = {
  sidebar: { min: 200, max: 400 },
  content: { min: 500, max: Infinity },
  codePanel: { min: 300, max: 600 },
};

export const useResizableColumns = () => {
  // Load initial widths from localStorage or use defaults
  const getInitialWidths = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api-detail-column-widths');
      if (saved) {
        try {
          return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
        } catch (e) {
          console.warn('Failed to parse saved column widths:', e);
        }
      }
    }
    return DEFAULT_WIDTHS;
  };

  const [widths, setWidths] = useState(getInitialWidths);
  const [isDragging, setIsDragging] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Get container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('[data-layout-container]');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Save widths to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('api-detail-column-widths', JSON.stringify(widths));
    }
  }, [widths]);

  const startResize = useCallback((handle) => {
    setIsDragging(handle);
  }, []);

  const stopResize = useCallback(() => {
    setIsDragging(null);
  }, []);

  const handleResize = useCallback((handle, deltaX) => {
    if (handle === 'sidebar-content') {
      setWidths(prev => {
        const actualDeltaX = deltaX;
        const newSidebarWidth = Math.max(
          CONSTRAINTS.sidebar.min,
          Math.min(CONSTRAINTS.sidebar.max, prev.sidebar + actualDeltaX)
        );
        
        // Adjust content width accordingly
        const actualSidebarDelta = newSidebarWidth - prev.sidebar;
        const newContentWidth = Math.max(
          CONSTRAINTS.content.min,
          prev.content - actualSidebarDelta
        );
        
        return {
          ...prev,
          sidebar: newSidebarWidth,
          content: newContentWidth,
        };
      });
    } else if (handle === 'content-code') {
      setWidths(prev => {
        const actualDeltaX = deltaX;
        const newContentWidth = Math.max(
          CONSTRAINTS.content.min,
          prev.content + actualDeltaX
        );
        
        // For code panel, we only need to track minimum width since it's flex-1
        const currentCodePanelMinWidth = Math.max(
          CONSTRAINTS.codePanel.min,
          prev.codePanel
        );
        
        return {
          ...prev,
          content: newContentWidth,
          codePanel: currentCodePanelMinWidth, // Keep minimum width for constraint
        };
      });
    }
  }, []);

  return {
    widths,
    isDragging,
    startResize,
    stopResize,
    handleResize,
    constraints: CONSTRAINTS,
  };
};