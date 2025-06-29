import { createContext, useContext, useState } from 'react';

const HighlightContext = createContext({ activeId: null, setActiveId: () => {} });

export function HighlightProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  return (
    <HighlightContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </HighlightContext.Provider>
  );
}

export const useHighlightContext = () => useContext(HighlightContext);
