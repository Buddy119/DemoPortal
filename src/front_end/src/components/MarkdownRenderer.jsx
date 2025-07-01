import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

// Detect Tailwind's dark mode class to adjust Mermaid theme for better contrast
const mermaidTheme =
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'default';
mermaid.initialize({ startOnLoad: true, theme: mermaidTheme });

export default function MarkdownRenderer({ children, components = {} }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const blocks = containerRef.current.querySelectorAll(
        '.language-mermaid, .mermaid'
      );
      if (blocks.length > 0) {
        mermaid.init(undefined, blocks);
      }
    }
  }, [children]);

  return (
    <div ref={containerRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ node, ...props }) {
            return <a target="_blank" rel="noopener noreferrer" {...props} />;
          },
          table({ children }) {
            return (
              <div className="overflow-auto">
                <table className="min-w-full border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          ...components,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
