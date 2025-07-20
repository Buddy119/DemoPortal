import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import apiBundles from '../data/apiBundles';
import scenarios from '../data/scenarios';
import scenarioFilters from '../data/scenarioFilters';
import scenarioFlows from '../data/scenarioFlows';
import apis from '../data/apisFlat';
import { generateSlug } from '../utils/slugUtils';
import { saveFilterState, loadFilterState, clearFilterState } from '../utils/filterStateManager';
import HsbcNavbar from '../components/HsbcNavbar';
import FlowsSidebar from '../components/FlowsSidebar';
import ChatPanel from '../components/ChatPanel';

const ApiFilterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter state management
  const [selectedFilters, setSelectedFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(true);
  
  // Collapsible filter categories state (initially all expanded)
  const [expandedCategories, setExpandedCategories] = useState({});

  // Get scenario context from URL params
  const scenarioParam = searchParams.get('scenario');
  const selectedScenario = scenarios.find(s => s.id === scenarioParam);
  const scenarioFilterConfig = scenarioParam ? scenarioFilters[scenarioParam] : null;
  const scenarioFlow = scenarioParam ? scenarioFlows[scenarioParam] : null;

  // Initialize expanded categories when scenario changes
  useEffect(() => {
    if (scenarioFilterConfig) {
      const initialExpanded = {};
      Object.keys(scenarioFilterConfig.filters).forEach(filterKey => {
        initialExpanded[filterKey] = true; // All categories expanded by default
      });
      setExpandedCategories(initialExpanded);
    }
  }, [scenarioFilterConfig]);

  // Load saved filter state on component mount (if returning from API detail page)
  useEffect(() => {
    const savedState = loadFilterState();
    
    // Only restore state if we're on the same scenario and have saved data
    if (savedState && savedState.scenarioId === scenarioParam && savedState.hasSearched) {
      console.log('Restoring saved filter state:', savedState);
      
      // Restore filter selections
      if (savedState.selectedFilters) {
        setSelectedFilters(savedState.selectedFilters);
      }
      
      // Restore search state
      if (savedState.hasSearched !== undefined) {
        setHasSearched(savedState.hasSearched);
      }
      
      // Restore search query
      if (savedState.searchQuery) {
        setSearchQuery(savedState.searchQuery);
      }
      
      // Restore expanded categories
      if (savedState.expandedCategories) {
        setExpandedCategories(savedState.expandedCategories);
      }
    }
  }, [scenarioParam]); // Only run when scenario changes

  // Save filter state whenever relevant state changes (for preserving navigation context)
  useEffect(() => {
    if (scenarioParam) {
      const currentState = {
        selectedFilters,
        scenarioId: scenarioParam,
        hasSearched,
        searchQuery,
        expandedCategories
      };
      
      // Only save if there's meaningful state to preserve
      if (hasSearched || Object.keys(selectedFilters).length > 0) {
        saveFilterState(currentState);
      }
    }
  }, [selectedFilters, scenarioParam, hasSearched, searchQuery, expandedCategories]);

  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  // Handle filter selection (toggleable)
  const handleFilterChange = (category, option) => {
    setSelectedFilters(prev => {
      // If the same option is clicked again, deselect it
      if (prev[category] === option) {
        const newFilters = { ...prev };
        delete newFilters[category];
        return newFilters;
      }
      // Otherwise, select the new option
      return {
        ...prev,
        [category]: option
      };
    });
  };

  // Clear all filter selections
  const handleClearFilters = () => {
    setSelectedFilters({});
    // Note: We don't clear session storage here as user might want to preserve the "hasSearched" state
  };

  // Toggle category expansion
  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Handle search confirmation
  const handleSearchConfirm = async () => {
    setIsLoading(true);
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasSearched(true);
    setIsLoading(false);
  };

  // Reset everything including search state  
  const handleResetAll = () => {
    setSelectedFilters({});
    setHasSearched(false);
    setSearchQuery('');
    
    // Clear session storage when fully resetting to avoid stale breadcrumb data
    clearFilterState();
  };

  // Filter API bundles based on selected filters and scenario
  const filteredApis = useMemo(() => {
    if (!hasSearched) return [];

    let filtered = apiBundles;

    // Filter by scenario if provided
    if (selectedScenario) {
      filtered = filtered.filter(bundle => bundle.scenario === selectedScenario.name);
    }

    // Apply selected filters
    Object.entries(selectedFilters).forEach(([category, selectedOption]) => {
      if (selectedOption) {
        filtered = filtered.filter(bundle => {
          switch (category) {
            case 'customerType':
              return bundle.customerType && bundle.customerType.includes(selectedOption);
            case 'market':
              return bundle.market === selectedOption || bundle.market === 'Global';
            case 'brand':
              return bundle.brand && bundle.brand.includes(selectedOption);
            case 'apiType':
            case 'apiFunctionalities':
              return (bundle.functionalities && bundle.functionalities.includes(selectedOption)) ||
                     (bundle.tags && bundle.tags.includes(selectedOption));
            default:
              return true;
          }
        });
      }
    });

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(bundle => 
        bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedScenario, selectedFilters, searchQuery, hasSearched]);

  // Check if any filters are selected
  const hasActiveFilters = Object.values(selectedFilters).some(value => value);

  // Handle navigation to API details page (save filter state for breadcrumb return)
  const handleApiDetailsNavigation = (apiSlug) => {
    // Save current filter state before navigating
    const currentState = {
      selectedFilters,
      scenarioId: scenarioParam,
      hasSearched,
      searchQuery,
      expandedCategories
    };
    
    console.log('Saving filter state before navigating to API details:', currentState);
    saveFilterState(currentState);
    
    // Navigate to API details page
    navigate(`/api/${apiSlug}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />
      
      <div className="flex min-h-screen">
        {/* Left Sidebar - Fixed Width Filter Panel */}
        <div className="hidden lg:block w-80 bg-gray-800 border-r border-gray-700">
          <div className="p-6">
            {/* Back to Scenarios */}
            <Link
              to="/scenarios"
              className="inline-flex items-center text-red-400 hover:text-red-300 text-sm font-medium transition-colors mb-6"
            >
              ← Back to Scenarios
            </Link>

            {/* Filter Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">
                Filter Options
              </h2>
              {selectedScenario && (
                <p className="text-gray-400 text-sm mb-2">
                  {selectedScenario.name}
                </p>
              )}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Tip:</strong> Click any filter to select it. Click again to deselect.
                </p>
              </div>
            </div>

            {/* Scenario-Specific Filters - Collapsible Categories */}
            {scenarioFilterConfig && (
              <div className="space-y-4">
                {Object.entries(scenarioFilterConfig.filters).map(([filterKey, filterConfig]) => (
                  <div key={filterKey} className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => toggleCategory(filterKey)}
                      className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                      aria-expanded={expandedCategories[filterKey]}
                      aria-controls={`category-${filterKey}`}
                    >
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                        {filterConfig.label}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {/* Selected count indicator */}
                        {selectedFilters[filterKey] && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                            1
                          </span>
                        )}
                        {/* Chevron icon */}
                        <ChevronDownIcon 
                          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                            expandedCategories[filterKey] ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Category Options - Collapsible */}
                    <div 
                      id={`category-${filterKey}`}
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedCategories[filterKey] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-4 pt-0 space-y-2">
                        {filterConfig.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleFilterChange(filterKey, option)}
                            className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
                              selectedFilters[filterKey] === option
                                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25 transform scale-105'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent hover:border-gray-600 hover:shadow-md hover:transform hover:scale-102'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {selectedFilters[filterKey] === option && (
                                <span className="text-red-200 text-xs">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
              <button
                onClick={handleSearchConfirm}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </div>
                ) : hasSearched ? (
                  '🔄 Update Results'
                ) : (
                  '🔍 Search APIs'
                )}
              </button>
              
              <button
                onClick={handleClearFilters}
                className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
              >
                🧹 Clear Filters
              </button>
              
              {hasSearched && (
                <button
                  onClick={handleResetAll}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm"
                >
                  🔄 Reset All & Start Over
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Dynamic Width */}
        <div className="flex-1 min-w-0">
          {/* Header Section */}
          <div className="bg-gray-900 border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span className="text-sm">Filters</span>
              </button>

              {/* Page Title */}
              <div className="text-center lg:text-left flex-1 lg:flex-none">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {selectedScenario ? `${selectedScenario.name} APIs` : 'API Catalog'}
                </h1>
                {selectedScenario && (
                  <p className="text-gray-400 text-lg mt-1">
                    {selectedScenario.description}
                  </p>
                )}
              </div>

              {/* Search Bar - Only show after search */}
              {hasSearched && (
                <div className="hidden lg:block relative w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in results..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {!hasSearched ? (
              /* Initial Guidance State */
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-lg">
                  <div className="text-8xl mb-8 opacity-60">⚙️</div>
                  <h2 className="text-2xl font-semibold text-gray-300 mb-4">
                    Configure Your API Search
                  </h2>
                  <p className="text-gray-500 text-lg leading-relaxed mb-6">
                    Please select your desired filters on the left and click 
                    <strong className="text-white"> "Search APIs" </strong> 
                    to view matching API bundles.
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">
                      💡 <strong>Tip:</strong> Use the filters to narrow down APIs by customer type, market, brand, and specific functionalities relevant to your integration needs.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Results Display */
              <>
                {/* Results Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      🎯 Search Results
                    </h2>
                    <div className="text-sm text-gray-400">
                      Found {filteredApis.length} bundle{filteredApis.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(selectedFilters).map(([category, value]) => 
                        value ? (
                          <span key={category} className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium">
                            {scenarioFilterConfig?.filters[category]?.label}: {value}
                          </span>
                        ) : null
                      )}
                      {searchQuery && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                          Search: "{searchQuery}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommended API Integration Sequence - Sticky */}
                {scenarioFlow && filteredApis.length > 0 && (
                  <div className="sticky top-2 sm:top-4 z-30 mb-6 sm:mb-8 mx-auto max-w-full bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 rounded-lg sm:rounded-xl border border-gray-600 shadow-2xl backdrop-blur-sm"
                       style={{
                         background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.95) 50%, rgba(55, 65, 81, 0.95) 100%)',
                         backdropFilter: 'blur(10px)',
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                         transition: 'all 0.3s ease-in-out'
                       }}>
                    {/* Header with Collapse Button */}
                    <div className="flex items-center justify-between p-6 pb-4">
                      <div className="flex-1 text-center">
                        <div className="inline-flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">🎯</span>
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            Recommended API Integration Sequence
                          </h3>
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">⭐</span>
                          </div>
                        </div>
                        {isSequenceExpanded && (
                          <p className="text-gray-300 text-sm">
                            Follow this optimized sequence for {scenarioFlow.name}
                          </p>
                        )}
                      </div>
                      
                      {/* Collapse/Expand Button */}
                      <button
                        onClick={() => setIsSequenceExpanded(!isSequenceExpanded)}
                        className="ml-4 flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 flex items-center justify-center transition-all duration-200 group"
                        title={isSequenceExpanded ? "Collapse sequence" : "Expand sequence"}
                        aria-label={isSequenceExpanded ? "Collapse API integration sequence" : "Expand API integration sequence"}
                      >
                        {isSequenceExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                    
                    {/* Collapsible Content */}
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      isSequenceExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-6 pb-6">
                        {/* Flow Steps */}
                        <div className="flex flex-col lg:flex-row items-center justify-center space-y-3 lg:space-y-0 lg:space-x-3 mb-6">
                          {scenarioFlow.flow.split(' → ').map((step, index, array) => (
                            <div key={index} className="flex items-center">
                              <div className="rounded-lg px-4 py-3 border bg-red-600/15 border-red-400/40 hover:border-red-300 hover:bg-red-600/25 shadow-lg transition-all duration-300 transform hover:scale-105">
                                <span className="font-medium text-white text-sm lg:text-base leading-tight">
                                  {step.trim()}
                                </span>
                              </div>
                              {index < array.length - 1 && (
                                <div className="flex-shrink-0 mx-2 lg:mx-3">
                                  <div className="lg:hidden flex justify-center">
                                    <div className="text-xl text-red-300 animate-pulse font-bold">↓</div>
                                  </div>
                                  <div className="hidden lg:flex justify-center">
                                    <div className="text-xl text-red-300 animate-pulse font-bold">→</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Helper Text */}
                        <div className="text-center">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600/20 rounded-full text-xs text-blue-300 border border-blue-500/30">
                            <span>💡</span>
                            <span className="hidden sm:inline">Click on API bundles below to access detailed implementation guides</span>
                            <span className="sm:hidden">Bundles below for guides</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {filteredApis.length > 0 ? (
                  /* API Bundle Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredApis.map((bundle, index) => {
                      const firstApiId = bundle.apis?.[0];
                      const firstApi = firstApiId ? apis.find(api => api.id === firstApiId) : null;
                      
                      return (
                        <div
                          key={index}
                          className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:transform hover:scale-105 group"
                        >
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {bundle.name}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {bundle.description}
                            </p>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {bundle.tags?.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                            <span>Market: {bundle.market}</span>
                            {bundle.customerType?.length > 0 && (
                              <span>{bundle.customerType.join(', ')}</span>
                            )}
                          </div>

                          {/* Action Button */}
                          {firstApi ? (
                            <button
                              onClick={() => handleApiDetailsNavigation(generateSlug(firstApi.name))}
                              className="block w-full bg-red-600 hover:bg-red-700 group-hover:bg-red-500 text-white text-center py-2 px-4 rounded font-medium transition-all duration-300 transform group-hover:scale-105"
                            >
                              View API Details
                            </button>
                          ) : (
                            <div className="block w-full bg-gray-700 text-gray-400 text-center py-2 px-4 rounded font-medium">
                              Documentation Coming Soon
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* No Results State */
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-6">🔍❌</div>
                      <h3 className="text-xl font-semibold text-white mb-4">
                        No APIs Found
                      </h3>
                      <p className="text-gray-400 mb-6">
                        No API bundles match your current filter selection. Try adjusting your criteria for better results.
                      </p>
                      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-6">
                        <h4 className="text-amber-400 font-medium mb-2">💡 Suggestions</h4>
                        <ul className="text-sm text-amber-200 space-y-1 text-left">
                          <li>• Try selecting "All" in one or more filter categories</li>
                          <li>• Clear your search query if you have one</li>
                          <li>• Consider different combinations of filters</li>
                          <li>• Remove some specific filters to broaden results</li>
                        </ul>
                      </div>
                      <button
                        onClick={handleResetAll}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        🔄 Reset All & Try Again
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-80 bg-gray-800 text-white overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              {/* Mobile Filter Content - Collapsible Categories */}
              {scenarioFilterConfig && (
                <div className="space-y-4">
                  {Object.entries(scenarioFilterConfig.filters).map(([filterKey, filterConfig]) => (
                    <div key={filterKey} className="border border-gray-700 rounded-lg overflow-hidden">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(filterKey)}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                        aria-expanded={expandedCategories[filterKey]}
                        aria-controls={`mobile-category-${filterKey}`}
                      >
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                          {filterConfig.label}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {/* Selected count indicator */}
                          {selectedFilters[filterKey] && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                              1
                            </span>
                          )}
                          {/* Chevron icon */}
                          <ChevronDownIcon 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                              expandedCategories[filterKey] ? 'transform rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Category Options - Collapsible */}
                      <div 
                        id={`mobile-category-${filterKey}`}
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedCategories[filterKey] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="p-4 pt-0 space-y-2">
                          {filterConfig.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleFilterChange(filterKey, option)}
                              className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
                                selectedFilters[filterKey] === option
                                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25 transform scale-105'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent hover:border-gray-600 hover:shadow-md hover:transform hover:scale-102'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {selectedFilters[filterKey] === option && (
                                  <span className="text-red-200 text-xs">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
                <button
                  onClick={() => {
                    handleSearchConfirm();
                    setIsMobileFilterOpen(false);
                  }}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    isLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : hasSearched ? (
                    '🔄 Update Results'
                  ) : (
                    '🔍 Search APIs'
                  )}
                </button>
                
                <button
                  onClick={handleClearFilters}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                >
                  🧹 Clear Filters
                </button>
                
                {hasSearched && (
                  <button
                    onClick={() => {
                      handleResetAll();
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm"
                  >
                    🔄 Reset All & Start Over
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default ApiFilterPage;