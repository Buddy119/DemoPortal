import React, { useState } from 'react';

export default function ApiDetailsCodePanel({ currentApi, selectedLanguage, setSelectedLanguage }) {
  const [copied, setCopied] = useState(false);
  const [endpointCopied, setEndpointCopied] = useState(false);

  const handleCopy = async () => {
    const code = currentApi.codeSamples?.[selectedLanguage] || '';
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCopyEndpoint = async () => {
    if (currentApi.endpoint) {
      try {
        await navigator.clipboard.writeText(currentApi.endpoint);
        setEndpointCopied(true);
        setTimeout(() => setEndpointCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy endpoint:', err);
      }
    }
  };

  const handleCopyForLLM = async () => {
    const llmContent = `API: ${currentApi.name}
Endpoint: ${currentApi.endpoint}
Method: ${currentApi.method || 'POST'}
Description: ${currentApi.description}

Sections:
${currentApi.sections?.map(section => `${section.heading}: ${section.markdown}`).join('\n\n') || ''}

Code Sample (${selectedLanguage}):
${currentApi.codeSamples?.[selectedLanguage] || ''}`;
    
    try {
      await navigator.clipboard.writeText(llmContent);
    } catch (err) {
      console.error('Failed to copy for LLM:', err);
    }
  };

  const getLanguageIcon = (lang) => {
    const icons = {
      python: '🐍',
      'c++': '⚡',
      java: '☕',
      go: '🐹',
      'node.js': '🟢'
    };
    return icons[lang] || '📄';
  };

  const formatCode = (code) => {
    return code.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <span className="text-gray-500 text-sm mr-4 select-none w-8 text-right">
          {index + 1}
        </span>
        <span className="flex-1">{line}</span>
      </div>
    ));
  };

  const languages = currentApi.codeSamples ? Object.keys(currentApi.codeSamples) : [];

  return (
    <div className="w-full bg-gray-800 border-l border-gray-700 h-full overflow-y-auto">
      <div className="p-6">
        {/* Endpoint URL and Action Buttons */}
        {currentApi.endpoint && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            {/* Endpoint URL Row */}
            <div className="flex items-center space-x-3 mb-4">
              <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-bold rounded">
                {currentApi.method || 'POST'}
              </span>
              <code 
                className="flex-1 text-green-400 font-mono text-sm cursor-pointer hover:text-green-300 truncate"
                onClick={handleCopyEndpoint}
                title="Click to copy endpoint"
              >
                {currentApi.endpoint}
              </code>
              <button
                onClick={handleCopyEndpoint}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  endpointCopied ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                {endpointCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopyForLLM}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy for LLM
              </button>
              <button className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors">
                Test in sandbox
              </button>
            </div>
          </div>
        )}

        {/* OS Icons */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">⊞</span>
            </div>
            <span className="text-sm text-gray-400">Windows</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">🍎</span>
            </div>
            <span className="text-sm text-gray-400">Mac</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">🐧</span>
            </div>
            <span className="text-sm text-gray-400">Linux</span>
          </div>
        </div>

        {/* Language Tabs */}
        {languages.length > 0 && (
          <>
            <div className="flex space-x-1 mb-4 overflow-x-auto border-b border-gray-600">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`flex items-center px-3 py-2 text-sm whitespace-nowrap transition-all duration-200 relative ${
                    selectedLanguage === lang
                      ? 'bg-gray-700 text-white font-semibold'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{getLanguageIcon(lang)}</span>
                  {lang}
                  {selectedLanguage === lang && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Request samples header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Request samples</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="p-1.5 text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Code Display */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                  <code>
                    {currentApi.codeSamples[selectedLanguage] && 
                      formatCode(currentApi.codeSamples[selectedLanguage])
                    }
                  </code>
                </pre>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}