import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apis from '../data/apisFlat.js';
import { findApiBySlug } from '../utils/slugUtils.js';
import { buildFilterPageUrl, hasFilterState, getFilterStateDescription } from '../utils/filterStateManager.js';
import HsbcNavbar from '../components/HsbcNavbar.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import FlowsSidebar from '../components/FlowsSidebar.jsx';
import ApiDetailsSidebar from '../components/ApiDetailsSidebar.jsx';
import ApiDetailsMain from '../components/ApiDetailsMain.jsx';
import ApiDetailsCodePanel from '../components/ApiDetailsCodePanel.jsx';
import ResizeHandle from '../components/ResizeHandle.jsx';
import { useResizableColumns } from '../hooks/useResizableColumns.js';

export default function ApiDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  
  // State management for sidebar panels (consistent with ApiFilterPage)
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  
  const { 
    widths, 
    isDragging, 
    startResize, 
    stopResize, 
    handleResize 
  } = useResizableColumns();
  
  const currentApi = findApiBySlug(apis, slug);
  
  // Build the correct hierarchy for breadcrumb navigation
  const getBreadcrumbHierarchy = (api) => {
    if (!api) return [];
    
    // Special handling for DCR (Dynamic Client Registration) APIs
    if (api.bundle === "Dynamic Client Registration (DCR)") {
      return [
        { name: "Open Banking", category: "Open Banking" },
        { name: "Dynamic Client Registration (DCR)", category: "Dynamic Client Registration (DCR)" }
      ];
    }
    
    // Default: use the first tag as the primary category
    const primaryCategory = api.tags?.[0] || '';
    return primaryCategory ? [{ name: primaryCategory, category: primaryCategory }] : [];
  };
  
  const breadcrumbHierarchy = getBreadcrumbHierarchy(currentApi);
  
  // Toggle handlers for sidebar panels (consistent with ApiFilterPage)
  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };
  
  // Navigation handler for "Open Banking" breadcrumb - always goes to scenarios
  const navigateToOpenBanking = () => {
    console.log('Navigating to Open Banking scenarios page');
    navigate('/scenarios');
  };

  // Navigation handler for "Dynamic Client Registration (DCR)" breadcrumb - preserves filter state
  const navigateToDCR = () => {
    // Check if we have a saved filter state to restore
    if (hasFilterState()) {
      const filterUrl = buildFilterPageUrl();
      console.log('Navigating back to saved DCR filter state:', getFilterStateDescription());
      console.log('Target URL:', filterUrl);
      navigate(filterUrl);
    } else {
      // Fallback to scenarios page if no saved state
      console.log('No saved DCR filter state found, navigating to scenarios page');
      navigate('/scenarios');
    }
  };

  // Generic navigation handler for other categories
  const navigateToCategory = (category) => {
    console.log(`Navigating to category: ${category}`);
    navigate('/scenarios');
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
      {/* HSBC Navigation Bar with Chat Button */}
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />

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
            {breadcrumbHierarchy.map((level, index) => {
              // Determine the navigation handler and visual indicators based on the breadcrumb level
              const getNavigationHandler = () => {
                if (level.name === "Open Banking") {
                  return navigateToOpenBanking;
                } else if (level.name === "Dynamic Client Registration (DCR)") {
                  return navigateToDCR;
                } else {
                  return () => navigateToCategory(level.category);
                }
              };

              // Show green dot only for DCR breadcrumb when filter state exists
              const showFilterIndicator = level.name === "Dynamic Client Registration (DCR)" && hasFilterState();
              
              // Create appropriate tooltip message
              const getTooltipMessage = () => {
                if (level.name === "Open Banking") {
                  return "Navigate to Open Banking scenarios page";
                } else if (level.name === "Dynamic Client Registration (DCR)") {
                  return hasFilterState() 
                    ? `Return to saved filter state: ${getFilterStateDescription()}`
                    : "Navigate to scenarios page";
                } else {
                  return "Navigate to scenarios page";
                }
              };

              return (
                <React.Fragment key={level.category}>
                  <li className="mx-2 text-gray-500" aria-hidden="true">›</li>
                  <li>
                    <button
                      onClick={getNavigationHandler()}
                      className="hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-1 cursor-pointer flex items-center space-x-1"
                      aria-label={`Navigate to ${level.name}`}
                      title={getTooltipMessage()}
                    >
                      <span>{level.name}</span>
                      {showFilterIndicator && (
                        <span className="text-green-400 text-xs" aria-hidden="true">●</span>
                      )}
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
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

      {/* Flows Sidebar - Consistent with ApiFilterPage */}
      <FlowsSidebar 
        isOpen={isFlowsSidebarOpen} 
        onClose={() => setIsFlowsSidebarOpen(false)} 
      />

      {/* Chat Panel - Now Available on API Details Page */}
      <ChatPanel 
        isOpen={isChatPanelOpen} 
        onClose={() => setIsChatPanelOpen(false)} 
      />
    </div>
  );
}