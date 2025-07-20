import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import scenarios from '../data/scenarios';
import scenarioFlows from '../data/scenarioFlows';
import HsbcNavbar from '../components/HsbcNavbar';
import FlowsSidebar from '../components/FlowsSidebar';
import ChatPanel from '../components/ChatPanel';
import ScenarioFlowDiagram from '../components/ScenarioFlowDiagram';

const ScenariosPage = () => {
  const navigate = useNavigate();
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('open-banking-account-payments'); // Default to first scenario
  const [isScenarioClicked, setIsScenarioClicked] = useState(false); // Track if a scenario was clicked for enhanced visibility
  const flowDiagramRef = useRef(null); // Reference to flow diagram section

  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  // Filter scenarios based on search query
  const filteredScenarios = useMemo(() => {
    if (!searchQuery) return scenarios;
    
    return scenarios.filter(scenario => 
      scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleScenarioClick = (scenario) => {
    // Navigate to APIs page with scenario context via URL params
    navigate(`/apis?scenario=${scenario.id}`);
  };

  const handleScenarioHover = (scenarioId) => {
    // Only update hover if no scenario is currently clicked (persistent state)
    if (!isScenarioClicked) {
      setSelectedScenarioId(scenarioId);
    }
  };

  const handleViewFlowDiagram = (scenarioId) => {
    // Set the selected scenario and mark as clicked for persistent display
    setSelectedScenarioId(scenarioId);
    setIsScenarioClicked(true);
    
    // Smooth scroll to flow diagram with offset for better visibility
    // Since diagram appears above the card, we need to scroll to it
    setTimeout(() => {
      if (flowDiagramRef.current) {
        const offsetTop = flowDiagramRef.current.offsetTop - 100; // 100px offset from top
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }, 300); // Delay to ensure DOM is updated with new diagram position

    // Note: Removed auto-disappearing timeout for persistent display
    // Diagram will only disappear when another scenario is selected
  };

  const handleHideFlowDiagram = () => {
    setIsScenarioClicked(false);
  };

  // Get the current selected scenario flow
  const selectedScenarioFlow = scenarioFlows[selectedScenarioId];

  // Update selected scenario when filtered scenarios change
  useEffect(() => {
    if (filteredScenarios.length > 0) {
      const isCurrentScenarioInFiltered = filteredScenarios.some(scenario => scenario.id === selectedScenarioId);
      if (!isCurrentScenarioInFiltered) {
        // If current selected scenario is not in filtered results, select the first one
        setSelectedScenarioId(filteredScenarios[0].id);
        // Also reset the clicked state since the scenario is no longer available
        setIsScenarioClicked(false);
      }
    }
  }, [filteredScenarios, selectedScenarioId]);

  // State for responsive grid columns
  const [columnsPerRow, setColumnsPerRow] = useState(3);

  // Update columns based on screen size
  useEffect(() => {
    const updateColumns = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth >= 1024) { // lg breakpoint
        setColumnsPerRow(3);
      } else if (screenWidth >= 768) { // md breakpoint
        setColumnsPerRow(2);
      } else {
        setColumnsPerRow(1);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Calculate where to insert the flow diagram (above the selected card)
  const getFlowDiagramPosition = () => {
    if (!isScenarioClicked || !selectedScenarioFlow) return null;
    
    const selectedIndex = filteredScenarios.findIndex(scenario => scenario.id === selectedScenarioId);
    if (selectedIndex === -1) return null;
    
    // Return the index of the selected card to place diagram directly above it
    return selectedIndex;
  };

  const flowDiagramPosition = useMemo(() => getFlowDiagramPosition(), [
    isScenarioClicked, 
    selectedScenarioFlow, 
    selectedScenarioId, 
    filteredScenarios, 
    columnsPerRow
  ]);

  return (
    <div className="min-h-screen bg-gray-900">
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            HSBC APIs – Choose Your Scenario
          </h1>
          <p className="text-gray-400 text-lg">
            Choose a business scenario to explore relevant APIs and documentation.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search Scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Scenario Cards with Dynamic Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredScenarios.map((scenario, index) => (
            <React.Fragment key={scenario.id}>
              {/* Dynamic Flow Diagram Insertion - Above Selected Card */}
              {flowDiagramPosition === index && selectedScenarioFlow && isScenarioClicked && (
                <div className="col-span-full">
                  <div 
                    ref={flowDiagramRef}
                    className="mb-8 transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in"
                  >
                    {/* Flow Diagram Header with Close Button */}
                    <div className="relative text-center mb-4">
                      <button
                        onClick={handleHideFlowDiagram}
                        className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                        title="Hide Flow Diagram"
                      >
                        ✕
                      </button>
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium shadow-lg">
                        <span>📊</span>
                        <span>API Flow for {selectedScenarioFlow.name}</span>
                        <span>✨</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2 mb-4">Persistent diagram for scenario below</div>
                      <div className="text-red-400 text-lg animate-bounce">
                        ↓
                      </div>
                    </div>
                    
                    <ScenarioFlowDiagram 
                      key={selectedScenarioId}
                      scenarioFlow={selectedScenarioFlow}
                      isVisible={true}
                      isHighlighted={true}
                    />
                  </div>
                </div>
              )}

              {/* Scenario Card */}
              <div
                onClick={() => handleScenarioClick(scenario)}
                onMouseEnter={() => handleScenarioHover(scenario.id)}
                className={`bg-gray-800 rounded-xl p-8 border transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl ${
                  selectedScenarioId === scenario.id 
                    ? 'border-red-500 bg-gray-750' 
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                }`}
              >
                {/* Icon */}
                <div className="text-4xl mb-6 flex justify-center">
                  <span role="img" aria-label={scenario.name}>
                    {scenario.icon}
                  </span>
                </div>
                
                {/* Scenario Name */}
                <h3 className="text-xl font-bold text-white mb-4 text-center leading-tight">
                  {scenario.name}
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 text-center leading-relaxed mb-4">
                  {scenario.description}
                </p>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* View/Hide Flow Diagram Button */}
                  {selectedScenarioId === scenario.id && isScenarioClicked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card's onClick
                        handleHideFlowDiagram();
                      }}
                      className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 touch-manipulation bg-red-600 text-white shadow-lg border border-red-500 hover:bg-red-700"
                    >
                      ❌ Hide Flow Diagram
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card's onClick
                        handleViewFlowDiagram(scenario.id);
                      }}
                      className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 touch-manipulation bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white active:bg-red-700"
                    >
                      📊 View API Flow →
                    </button>
                  )}
                  
                  {/* Explore APIs Indicator */}
                  <div className="text-center">
                    <span className="text-red-400 text-xs font-medium">
                      Or click card to explore APIs
                    </span>
                  </div>
                </div>
              </div>

            </React.Fragment>
          ))}
        </div>


        {/* No Results Message */}
        {filteredScenarios.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No scenarios found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms to find what you're looking for.
            </p>
          </div>
        )}

        {/* Results Counter */}
        {searchQuery && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Showing {filteredScenarios.length} of {scenarios.length} scenarios
            </p>
          </div>
        )}
      </main>

      {/* Flows Sidebar */}
      <FlowsSidebar 
        isOpen={isFlowsSidebarOpen} 
        onClose={() => setIsFlowsSidebarOpen(false)} 
      />

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={isChatPanelOpen} 
        onClose={() => setIsChatPanelOpen(false)} 
      />
    </div>
  );
};

export default ScenariosPage;