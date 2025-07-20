import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apis from '../data/apisFlat.js';
import { findApiBySlug } from '../utils/slugUtils.js';
import ApiDetailsSidebar from '../components/ApiDetailsSidebar.jsx';
import ApiDetailsMain from '../components/ApiDetailsMain.jsx';
import ApiDetailsCodePanel from '../components/ApiDetailsCodePanel.jsx';
import ResizeHandle from '../components/ResizeHandle.jsx';
import { useResizableColumns } from '../hooks/useResizableColumns.js';

export default function ApiDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const { 
    widths, 
    isDragging, 
    startResize, 
    stopResize, 
    handleResize 
  } = useResizableColumns();
  
  const currentApi = findApiBySlug(apis, slug);
  
  // Get the primary category for breadcrumb (first tag)
  const primaryCategory = currentApi?.tags?.[0] || '';
  
  // Helper function to navigate to APIs page with category filter
  const navigateToCategory = (category) => {
    navigate(`/apis?filter=${encodeURIComponent(category)}`);
  };

  if (!currentApi) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">API Not Found</h1>
          <p className="text-gray-400">The requested API documentation could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-red-500 font-bold text-xl">HSBC</div>
            <nav className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white">Home</a>
              <a href="#" className="text-white">APIs</a>
              <a href="#" className="text-gray-300 hover:text-white">SDKs</a>
              <a href="#" className="text-gray-300 hover:text-white">Case Studies</a>
              <a href="#" className="text-gray-300 hover:text-white">Tools</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search or ask an AI..." 
                className="bg-gray-700 text-white px-4 py-2 rounded-md w-64 text-sm"
              />
              <span className="absolute right-3 top-2 text-gray-400 text-xs">⌘K</span>
            </div>
            <button className="text-gray-300 hover:text-white">Help</button>
            <button className="text-gray-300 hover:text-white">Login</button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
              Register
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-2 flex-shrink-0">
        <nav className="text-sm text-gray-400" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link 
                to="/" 
                className="hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-1"
                aria-label="Navigate to Home"
              >
                Home
              </Link>
            </li>
            <li className="mx-2 text-gray-500" aria-hidden="true">›</li>
            <li>
              <Link 
                to="/scenarios" 
                className="hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-1"
                aria-label="Navigate to API Scenarios"
              >
                APIs
              </Link>
            </li>
            {primaryCategory && (
              <>
                <li className="mx-2 text-gray-500" aria-hidden="true">›</li>
                <li>
                  <button
                    onClick={() => navigateToCategory(primaryCategory)}
                    className="hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-1 cursor-pointer"
                    aria-label={`Filter APIs by ${primaryCategory} category`}
                  >
                    {primaryCategory}
                  </button>
                </li>
              </>
            )}
            <li className="mx-2 text-gray-500" aria-hidden="true">›</li>
            <li>
              <span className="text-white font-medium" aria-current="page">
                {currentApi.name}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Main Layout - Resizable Three-Column Layout */}
      <div className="flex flex-1 min-w-0 overflow-hidden" data-layout-container>
        {/* Left Sidebar */}
        <div 
          className="flex-shrink-0 bg-gray-800"
          style={{ width: `${widths.sidebar}px` }}
        >
          <ApiDetailsSidebar currentApi={currentApi} />
        </div>
        
        {/* Sidebar-Content Resizer */}
        <ResizeHandle
          onResize={(deltaX) => handleResize('sidebar-content', deltaX)}
          onStart={() => startResize('sidebar-content')}
          onStop={stopResize}
          isActive={isDragging === 'sidebar-content'}
        />
        
        {/* Main Content */}
        <div 
          className="flex-shrink-0"
          style={{ width: `${widths.content}px` }}
        >
          <ApiDetailsMain currentApi={currentApi} />
        </div>
        
        {/* Content-Code Panel Resizer */}
        <ResizeHandle
          onResize={(deltaX) => handleResize('content-code', deltaX)}
          onStart={() => startResize('content-code')}
          onStop={stopResize}
          isActive={isDragging === 'content-code'}
        />
        
        {/* Right Code Panel */}
        <div 
          className="flex-1"
          style={{ minWidth: `${widths.codePanel}px` }}
        >
          <ApiDetailsCodePanel 
            currentApi={currentApi}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
        </div>
      </div>
    </div>
  );
}