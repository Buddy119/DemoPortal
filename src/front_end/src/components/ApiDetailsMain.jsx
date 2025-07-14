import React from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ApiDetailsMain({ currentApi }) {
  const processMarkdown = (markdown) => {
    // Remove entire "Related guides" section to prevent duplication (handles various formats)
    let processedMarkdown = markdown.replace(
      /Related guides?:\s*\*\*.*?\*\*(\s*and\s*\*\*.*?\*\*)*/g,
      ''
    );
    
    // Remove "Was this section useful?" from markdown content
    processedMarkdown = processedMarkdown.replace(
      /Was this section useful\?\s*\*\*Yes\*\*\s*\*\*No\*\*/g,
      ''
    );
    
    // Clean up excessive whitespace and empty lines
    processedMarkdown = processedMarkdown.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    // Remove orphaned periods at the end of content
    processedMarkdown = processedMarkdown.replace(/\.\s*$/, '');
    
    // Remove isolated periods on their own lines
    processedMarkdown = processedMarkdown.replace(/^\.\s*$/gm, '');
    
    return processedMarkdown;
  };

  return (
    <div className="w-full bg-gray-900 h-full overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0 px-10 py-8 pb-4">
          <div className="flex items-center mb-2">
            <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {currentApi.version}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentApi.name}
          </h1>
          {currentApi.subtitle && (
            <p className="text-lg text-gray-400 mb-4">
              {currentApi.subtitle}
            </p>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-10 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Dynamic Sections */}
            <div className="space-y-8">
              {currentApi.sections?.map((section, index) => (
                <section key={index} className="border-b border-gray-700 pb-6 last:border-b-0">
                  <h2 className="text-xl font-semibold text-white mb-4 pb-2">
                    {section.heading}
                  </h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <MarkdownRenderer
                      components={{
                        // Custom styling for different elements
                        p: ({ children }) => (
                          <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-300">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-700 text-green-400 px-2 py-1 rounded text-sm font-mono">{children}</code>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} className="text-red-400 hover:text-red-300 underline cursor-pointer" target="_blank" rel="noopener noreferrer">{children}</a>
                        ),
                      }}
                    >
                      {processMarkdown(section.markdown)}
                    </MarkdownRenderer>
                    
                    {/* Related Guides for Included section */}
                    {section.heading === 'Included' && currentApi.relatedGuides && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-400 text-sm mb-2">Related guides:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentApi.relatedGuides.map((guide, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-full cursor-pointer transition-colors"
                            >
                              {guide}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Feedback prompt for Included section */}
                    {section.heading === 'Included' && (
                      <div className="mt-4 pt-3 border-t border-gray-700">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-400 text-sm">Was this section useful?</span>
                          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
                            Yes
                          </button>
                          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}