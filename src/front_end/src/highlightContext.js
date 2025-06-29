import { createContext, useContext, useState, useEffect } from 'react';

const HighlightContext = createContext({ activeId: null, setActiveId: () => {} });

export function HighlightProvider({ children }) {
  const [activeId, setActiveId] = useState(() =>
    window.location.hash ? window.location.hash.replace('#', '') : null
  );

  useEffect(() => {
    const handler = () => {
      setActiveId(window.location.hash.replace('#', ''));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <HighlightContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </HighlightContext.Provider>
  );
}

export const useHighlightContext = () => useContext(HighlightContext);
