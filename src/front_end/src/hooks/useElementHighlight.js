import { animate } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

export function useElementHighlight(duration = 3000) {
  const timerRef = useRef(null);

  const highlight = useCallback(
    (selector) => {
      if (!selector) return;
      const el = document.querySelector(selector);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const classes = ['bg-yellow-200', 'ring-2', 'ring-yellow-400', 'shadow-md'];
      el.classList.add(...classes);

      // fade in
      animate(0, 1, {
        duration: 0.3,
        onUpdate: (latest) => {
          el.style.opacity = latest;
        },
      });

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        animate(1, 0, {
          duration: 0.3,
          onUpdate: (latest) => {
            el.style.opacity = latest;
          },
          onComplete: () => {
            el.classList.remove(...classes);
            el.style.opacity = '';
          },
        });
      }, duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return { highlight };
}
