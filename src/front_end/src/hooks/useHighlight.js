import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export const useHighlight = (activeId, id) => {
  const ref = useRef(null);

  useEffect(() => {
    if (activeId === id && ref.current) {
      animate(ref.current, { backgroundColor: '#fffbe6' }, { duration: 0.6 });
    }
  }, [activeId, id]);

  return ref;
};
