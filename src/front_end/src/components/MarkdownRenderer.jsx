import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ children, components = {} }) {
  return (
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
  );
}
