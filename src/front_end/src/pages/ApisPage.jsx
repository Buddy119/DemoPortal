import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronDownIcon, LockClosedIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { rawSidebarConfig, marketOptions } from '../data/apisConfig';
import apiBundles from '../data/apiBundles';
import apis from '../data/apisFlat';
import scenarioFilters from '../data/scenarioFilters';
import scenarioFlows from '../data/scenarioFlows';
import { generateSlug } from '../utils/slugUtils';
import HsbcNavbar from '../components/HsbcNavbar';
import FlowsSidebar from '../components/FlowsSidebar';
import ChatPanel from '../components/ChatPanel';

const ApisPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(new Set(['All']));
  const [confirmedFilters, setConfirmedFilters] = useState(new Set()); // Filters that have been confirmed
  const [hasConfirmedSelection, setHasConfirmedSelection] = useState(false); // Whether user has confirmed any selection
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState(''); // Search query that has been confirmed
  const [selectedMarket, setSelectedMarket] = useState('All Markets');
  const [confirmedMarket, setConfirmedMarket] = useState('All Markets'); // Market that has been confirmed
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSequenceCollapsed, setIsSequenceCollapsed] = useState(false);
  
  // Get scenario context from URL params
  const scenarioParam = searchParams.get('scenario');
  const selectedScenarioConfig = scenarioParam ? scenarioFilters[scenarioParam] : null;
  const selectedScenario = selectedScenarioConfig?.displayName;
  
  // Handle URL filter parameter for breadcrumb navigation
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && !selectedScenarioConfig) {
      // Only apply filter param if not in scenario mode
      // Check if the filter parameter matches a valid category
      const isValidFilter = rawSidebarConfig.some(section => 
        section.items.some(item => item.label === filterParam)
      );
      
      if (isValidFilter) {
        setSelectedFilters(new Set([filterParam]));
      }
    } else if (selectedScenarioConfig) {
      // Reset filters when entering scenario mode
      setSelectedFilters(new Set(['All']));
    }
    
    // Always start with empty confirmed state to ensure clean initial display
    setHasConfirmedSelection(false);
    setConfirmedFilters(new Set());
    setConfirmedSearchQuery('');
    setConfirmedMarket('All Markets');
  }, [searchParams, selectedScenarioConfig]);

  // Filter bundles based on confirmed filters only (not selected filters)
  // Implements AND logic between filter categories and OR logic within categories
  const filteredApis = useMemo(() => {
    // Return empty array if no filters have been confirmed yet
    if (!hasConfirmedSelection) {
      return [];
    }

    let filtered = apiBundles;

    // Filter by scenario if in scenario mode
    if (selectedScenarioConfig) {
      filtered = filtered.filter(bundle => bundle.scenario === selectedScenarioConfig.displayName);
    }

    // Filter by confirmed market
    if (confirmedMarket !== 'All Markets') {
      filtered = filtered.filter(api => api.market === confirmedMarket);
    }

    // Filter by confirmed search query (bundle name only)
    if (confirmedSearchQuery) {
      filtered = filtered.filter(bundle => 
        bundle.name.toLowerCase().includes(confirmedSearchQuery.toLowerCase())
      );
    }

    // Filter by confirmed sidebar selections with AND logic between categories
    if (!confirmedFilters.has('All') && confirmedFilters.size > 0) {
      filtered = filtered.filter(bundle => {
        if (selectedScenarioConfig) {
          // Group filters by category for AND logic between categories
          const filtersByCategory = {};
          
          // Organize selected filters by their categories
          for (const selectedFilter of confirmedFilters) {
            for (const [filterKey, filterConfig] of Object.entries(selectedScenarioConfig.filters)) {
              if (filterConfig.options.includes(selectedFilter)) {
                if (!filtersByCategory[filterKey]) {
                  filtersByCategory[filterKey] = [];
                }
                filtersByCategory[filterKey].push(selectedFilter);
                break;
              }
            }
          }
          
          // Apply AND logic between categories: all categories must match
          for (const [filterKey, selectedFiltersInCategory] of Object.entries(filtersByCategory)) {
            let categoryMatched = false;
            
            // Apply OR logic within category: any filter in category can match
            for (const selectedFilter of selectedFiltersInCategory) {
              switch (filterKey) {
                case 'customerType':
                  // Check if bundle's customerType array includes the selected filter
                  if (bundle.customerType && bundle.customerType.includes(selectedFilter)) {
                    categoryMatched = true;
                  }
                  break;
                case 'market':
                  // Check if bundle matches market (exact match or Global)
                  if (bundle.market === selectedFilter || 
                      (selectedFilter === 'Global' && bundle.market === 'Global') ||
                      (bundle.market === 'All Markets')) {
                    categoryMatched = true;
                  }
                  break;
                case 'brand':
                  // Check if bundle's brand array includes the selected filter
                  if (bundle.brand && bundle.brand.includes(selectedFilter)) {
                    categoryMatched = true;
                  }
                  break;
                case 'apiType':
                case 'apiFunctionalities':
                  // Check if bundle's functionalities array includes the selected filter
                  if (bundle.functionalities && bundle.functionalities.includes(selectedFilter)) {
                    categoryMatched = true;
                  }
                  // Also check tags for backwards compatibility
                  if (bundle.tags && bundle.tags.includes(selectedFilter)) {
                    categoryMatched = true;
                  }
                  break;
              }
              
              // If any filter in this category matches, move to next category
              if (categoryMatched) break;
            }
            
            // If this category didn't match any filter, bundle doesn't qualify
            if (!categoryMatched) return false;
          }
          
          // If we get here, all categories matched
          return true;
        } else {
          // Default filtering for non-scenario mode
          let bundleMatches = false;
          
          for (const selectedFilter of confirmedFilters) {
            // Special handling for general filters
            if (selectedFilter === 'Spotlight' && bundle.locked) {
              bundleMatches = true;
              break;
            }
            if (selectedFilter === 'Get Started' && !bundle.locked) {
              bundleMatches = true;
              break;
            }
            
            // Find which category/group this filter belongs to
            const filterGroup = rawSidebarConfig.find(section => 
              section.items.some(item => item.label === selectedFilter)
            );
            
            if (!filterGroup) continue;
            
            // Get the specific item to check for value mapping
            const filterItem = filterGroup.items.find(item => item.label === selectedFilter);
            const filterValue = filterItem?.value || selectedFilter;
            
            // Apply filter based on the group's filterKey
            switch (filterGroup.filterKey) {
              case 'tags':
                if (bundle.tags && bundle.tags.includes(filterValue)) {
                  bundleMatches = true;
                }
                break;
              case 'scenario':
                if (bundle.scenario === filterValue) {
                  bundleMatches = true;
                }
                break;
              case 'market':
                if (bundle.market === filterValue || 
                    (filterValue === 'Global' && bundle.market === 'Global') ||
                    (bundle.market === 'All Markets')) {
                  bundleMatches = true;
                }
                break;
              case 'customerType':
                if (bundle.customerType && bundle.customerType.includes(filterValue)) {
                  bundleMatches = true;
                }
                break;
              case 'brand':
                if (bundle.brand && bundle.brand.includes(filterValue)) {
                  bundleMatches = true;
                }
                break;
              case 'functionalities':
                if (bundle.functionalities && bundle.functionalities.includes(filterValue)) {
                  bundleMatches = true;
                }
                break;
              case 'type':
                // For backwards compatibility with API-based filtering
                if (bundle.apis && bundle.apis.some(apiId => {
                  const api = apis.find(a => a.id === apiId);
                  return api && api.type === filterValue;
                })) {
                  bundleMatches = true;
                }
                break;
              case 'special':
                // Already handled above
                break;
            }
            
            if (bundleMatches) break;
          }
          
          return bundleMatches;
        }
      });
    }

    return filtered;
  }, [confirmedFilters, confirmedSearchQuery, confirmedMarket, selectedScenarioConfig, hasConfirmedSelection]);

  // Calculate counts for sidebar items
  const getSidebarCounts = useMemo(() => {
    const counts = {};
    
    if (selectedScenarioConfig) {
      // Calculate counts for dynamic scenario filters
      Object.entries(selectedScenarioConfig.filters).forEach(([filterKey, filterConfig]) => {
        filterConfig.options.forEach(option => {
          let count = 0;
          
          // Filter bundles by scenario and confirmed market first
          let filteredBundles = apiBundles;
          
          // Filter by scenario if in scenario mode
          if (selectedScenarioConfig) {
            filteredBundles = filteredBundles.filter(bundle => bundle.scenario === selectedScenarioConfig.displayName);
          }
          
          // Filter by confirmed market (or show all if "All Markets" is selected)
          const marketFilteredBundles = confirmedMarket === 'All Markets' 
            ? filteredBundles 
            : filteredBundles.filter(bundle => bundle.market === confirmedMarket);
          
          // Count based on scenario filter type using new bundle structure
          switch (filterKey) {
            case 'customerType':
              count = marketFilteredBundles.filter(bundle => 
                bundle.customerType && bundle.customerType.includes(option)
              ).length;
              break;
            case 'market':
              count = marketFilteredBundles.filter(bundle => 
                bundle.market === option || 
                (option === 'Global' && bundle.market === 'Global') ||
                (bundle.market === 'All Markets')
              ).length;
              break;
            case 'brand':
              count = marketFilteredBundles.filter(bundle => 
                bundle.brand && bundle.brand.includes(option)
              ).length;
              break;
            case 'apiType':
            case 'apiFunctionalities':
              count = marketFilteredBundles.filter(bundle => 
                (bundle.functionalities && bundle.functionalities.includes(option)) ||
                (bundle.tags && bundle.tags.includes(option))
              ).length;
              break;
          }
          
          counts[option] = count;
        });
      });
    } else {
      // Default static filter counts
      rawSidebarConfig.forEach(section => {
        section.items.forEach(item => {
          let count = 0;
          
          // Filter bundles by scenario and confirmed market first
          let filteredBundles = apiBundles;
          
          // Filter by scenario if in scenario mode
          if (selectedScenarioConfig) {
            filteredBundles = filteredBundles.filter(bundle => bundle.scenario === selectedScenarioConfig.displayName);
          }
          
          // Filter by confirmed market (or show all if "All Markets" is selected)
          const marketFilteredBundles = confirmedMarket === 'All Markets' 
            ? filteredBundles 
            : filteredBundles.filter(bundle => bundle.market === confirmedMarket);
          
          // Special handling for general filters
          if (item.label === 'All') {
            count = marketFilteredBundles.length;
          } else if (item.label === 'Get Started') {
            count = marketFilteredBundles.filter(bundle => !bundle.locked).length;
          } else if (item.label === 'Spotlight') {
            count = marketFilteredBundles.filter(bundle => bundle.locked).length;
          } else {
            // Use the filterKey from the section to determine how to count
            const filterValue = item.value || item.label;
            
            switch (section.filterKey) {
              case 'tags':
                count = marketFilteredBundles.filter(bundle => 
                  bundle.tags && bundle.tags.includes(filterValue)
                ).length;
                break;
              case 'scenario':
                count = marketFilteredBundles.filter(bundle => 
                  bundle.scenario === filterValue
                ).length;
                break;
              case 'market':
                count = marketFilteredBundles.filter(bundle => 
                  bundle.market === filterValue || 
                  (filterValue === 'Global' && bundle.market === 'Global') ||
                  (bundle.market === 'All Markets')
                ).length;
                break;
              case 'customerType':
                count = marketFilteredBundles.filter(bundle => 
                  bundle.customerType && bundle.customerType.includes(filterValue)
                ).length;
                break;
              case 'brand':
                count = marketFilteredBundles.filter(bundle => 
                  bundle.brand && bundle.brand.includes(filterValue)
                ).length;
                break;
              case 'functionalities':
                count = marketFilteredBundles.filter(bundle => 
                  (bundle.functionalities && bundle.functionalities.includes(filterValue)) ||
                  (bundle.tags && bundle.tags.includes(filterValue))
                ).length;
                break;
              case 'type':
                // For backwards compatibility with API-based filtering
                count = marketFilteredBundles.filter(bundle => 
                  bundle.apis && bundle.apis.some(apiId => {
                    const api = apis.find(a => a.id === apiId);
                    return api && api.type === filterValue;
                  })
                ).length;
                break;
              default:
                // Fallback for unknown filterKey
                count = 0;
                break;
            }
          }
          
          counts[item.label] = count;
        });
      });
    }
    
    return counts;
  }, [confirmedMarket, selectedScenarioConfig]);

  const handleFilterClick = (filterLabel) => {
    setSelectedFilters(prev => {
      // If clicking "All", clear everything and set only "All"
      if (filterLabel === 'All') {
        return new Set(['All']);
      }
      
      if (selectedScenarioConfig) {
        // Dynamic scenario-based filter handling
        // Find which filter category this option belongs to
        let clickedFilterKey = null;
        let categoryOptions = [];
        
        for (const [filterKey, filterConfig] of Object.entries(selectedScenarioConfig.filters)) {
          if (filterConfig.options.includes(filterLabel)) {
            clickedFilterKey = filterKey;
            categoryOptions = filterConfig.options;
            break;
          }
        }
        
        if (!clickedFilterKey) {
          return prev;
        }
        
        // If the filter is already selected, deselect it
        if (prev.has(filterLabel)) {
          const newFilters = new Set(prev);
          newFilters.delete(filterLabel);
          
          // If no filters remain after deselection, default to "All"
          if (newFilters.size === 0) {
            newFilters.add('All');
          }
          
          return newFilters;
        }
        
        // Remove any other selections from the same category and add the clicked filter
        const newFilters = new Set(prev);
        // Remove "All" if it exists
        newFilters.delete('All');
        // Remove other options from the same category
        categoryOptions.forEach(option => {
          if (option !== filterLabel) {
            newFilters.delete(option);
          }
        });
        // Add the clicked filter
        newFilters.add(filterLabel);
        
        return newFilters;
      } else {
        // Default static filter handling
        // Find which category the clicked filter belongs to
        const clickedCategory = rawSidebarConfig.find(section => 
          section.items.some(item => item.label === filterLabel)
        );
        
        if (!clickedCategory) {
          return prev;
        }
        
        // Get all items from the clicked category
        const categoryItems = clickedCategory.items.map(item => item.label);
        
        // If the filter is already selected in its category, deselect it
        if (prev.has(filterLabel)) {
          const newFilters = new Set(prev);
          newFilters.delete(filterLabel);
          
          // If no filters remain after deselection, default to "All"
          if (newFilters.size === 0) {
            newFilters.add('All');
          }
          
          return newFilters;
        }
        
        // Clear all existing filters and set only the clicked filter
        // This ensures mutual exclusivity across categories
        const newFilters = new Set([filterLabel]);
        
        return newFilters;
      }
    });
  };

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setIsMarketDropdownOpen(false);
  };

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'api': return 'bg-blue-600';
      case 'webhooks': return 'bg-green-600';
      case 'websockets': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  // Handle filter confirmation
  const handleConfirmFilters = () => {
    setConfirmedFilters(new Set(selectedFilters));
    setConfirmedSearchQuery(searchQuery);
    setConfirmedMarket(selectedMarket);
    setHasConfirmedSelection(true);
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSelectedFilters(new Set(['All']));
    setConfirmedFilters(new Set());
    setSearchQuery('');
    setConfirmedSearchQuery('');
    setSelectedMarket('All Markets');
    setConfirmedMarket('All Markets');
    setHasConfirmedSelection(false);
  };

  // Check if current filters are different from confirmed filters
  const hasFilterChanges = useMemo(() => {
    if (!hasConfirmedSelection) return selectedFilters.size > 0 && !selectedFilters.has('All') || searchQuery || selectedMarket !== 'All Markets';
    
    const filtersChanged = selectedFilters.size !== confirmedFilters.size || 
      [...selectedFilters].some(filter => !confirmedFilters.has(filter));
    const searchChanged = searchQuery !== confirmedSearchQuery;
    const marketChanged = selectedMarket !== confirmedMarket;
    
    return filtersChanged || searchChanged || marketChanged;
  }, [selectedFilters, confirmedFilters, searchQuery, confirmedSearchQuery, selectedMarket, confirmedMarket, hasConfirmedSelection]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <div className="p-4">
            {/* Dynamic Scenario Filters or Default Filters */}
            {selectedScenarioConfig ? (
              // Render dynamic scenario-based filters
              Object.entries(selectedScenarioConfig.filters).map(([filterKey, filterConfig]) => (
                <div key={filterKey} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    {filterConfig.label}
                  </h3>
                  <div className="space-y-1">
                    {filterConfig.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleFilterClick(option)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          selectedFilters.has(option)
                            ? 'bg-red-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span>{option}</span>
                        <span className="text-xs text-gray-400">
                          {getSidebarCounts[option] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Render default filters when no scenario is selected
              rawSidebarConfig.map((section) => (
                <div key={section.label} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleFilterClick(item.label)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          selectedFilters.has(item.label)
                            ? 'bg-red-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-400">
                          {getSidebarCounts[item.label] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Confirmation Buttons */}
            <div className="mt-8 pt-4 border-t border-gray-700">
              <div className="space-y-3">
                <button
                  onClick={handleConfirmFilters}
                  disabled={!hasFilterChanges}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    hasFilterChanges
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {hasConfirmedSelection ? '🔄 Update Results' : '🔍 Search APIs'}
                </button>
                
                {hasConfirmedSelection && (
                  <button
                    onClick={handleClearFilters}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                  >
                    ✨ Clear All Filters
                  </button>
                )}
              </div>
              
              {hasFilterChanges && hasConfirmedSelection && (
                <p className="text-xs text-amber-400 mt-2 text-center">
                  💡 You have unsaved filter changes
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Scenario Context Banner */}
          {selectedScenario && (
            <div className="bg-red-600 border-b border-red-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-white font-medium">
                    API Scenario: {selectedScenario}
                  </span>
                </div>
                <Link
                  to="/scenarios"
                  className="text-red-200 hover:text-white text-sm underline"
                >
                  Choose Different Scenario
                </Link>
              </div>
            </div>
          )}

          {/* Top Bar */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4">
              {/* Back to Scenarios Link - only show when no scenario context */}
              {!selectedScenario && (
                <Link
                  to="/scenarios"
                  className="flex items-center text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  ← Back to Scenarios
                </Link>
              )}
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span className="text-sm">Filters</span>
              </button>

              {/* Search Bar - Only show after filter confirmation */}
              {hasConfirmedSelection && (
                <div className="flex-1 relative">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for APIs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 text-white placeholder-gray-400 pl-10 pr-12 lg:pr-16 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <kbd className="hidden sm:block absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs text-gray-400 bg-gray-600 rounded">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              )}

              {/* Market Selector - Only show after filter confirmation */}
              {hasConfirmedSelection && (
                <div className="relative">
                  <button
                    onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                    className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-sm hidden sm:inline">Market: </span>
                    <span className="text-sm">{selectedMarket}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {isMarketDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-10">
                      <div className="p-1">
                        {marketOptions.map((market) => (
                          <button
                            key={market}
                            onClick={() => handleMarketSelect(market)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              selectedMarket === market
                                ? 'bg-red-600 text-white'
                                : 'text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {market}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Results Counter */}
              {hasConfirmedSelection && (
                <div className="hidden md:block text-sm text-gray-400">
                  Showing {filteredApis.length === 0 ? '0' : '1'}–{filteredApis.length} of {apiBundles.length} bundles
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="p-6">
            {!hasConfirmedSelection ? (
              /* Initial State - Empty with instructive message */
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center max-w-lg">
                  <div className="text-7xl mb-6 opacity-50">📋</div>
                  <h2 className="text-2xl font-semibold text-gray-300 mb-4">
                    Select Your API Filters
                  </h2>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Please select filters on the left and click <strong className="text-white">"Search APIs"</strong> to view matching API bundles.
                  </p>
                </div>
              </div>
            ) : (
              /* Results Display */
              <>
                {/* Results Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      🎯 API Results
                    </h2>
                    <div className="text-sm text-gray-400">
                      Found {filteredApis.length} bundle{filteredApis.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {confirmedMarket !== 'All Markets' && (
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium">
                        Market: {confirmedMarket}
                      </span>
                    )}
                    {confirmedSearchQuery && (
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                        Search: "{confirmedSearchQuery}"
                      </span>
                    )}
                    {[...confirmedFilters].filter(f => f !== 'All').map(filter => (
                      <span key={filter} className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                        {filter}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended API Integration Sequence - Moved to prominent position with sticky behavior */}
                {selectedScenarioConfig && scenarioFlows[scenarioParam] && filteredApis.length > 0 && (
                  <div 
                    className="sticky top-2 sm:top-4 z-40 mb-6 sm:mb-8 mx-auto max-w-full bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-600 shadow-2xl backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.95) 50%, rgba(55, 65, 81, 0.95) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {/* Header with enhanced styling and collapse functionality */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex-1 text-center">
                        <div className="inline-flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">🎯</span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-white">
                            Recommended API Integration Sequence
                          </h3>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">⭐</span>
                          </div>
                        </div>
                        {!isSequenceCollapsed && (
                          <p className="text-gray-300 text-xs sm:text-sm">
                            Follow this optimized sequence for {scenarioFlows[scenarioParam].name}
                          </p>
                        )}
                      </div>
                      
                      {/* Collapse/Expand Button */}
                      <button
                        onClick={() => setIsSequenceCollapsed(!isSequenceCollapsed)}
                        className="ml-2 sm:ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 flex items-center justify-center transition-all duration-200"
                        title={isSequenceCollapsed ? "Expand sequence" : "Collapse sequence"}
                      >
                        <span className="text-gray-300 text-sm font-bold transform transition-transform duration-200" style={{
                          transform: isSequenceCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          ▼
                        </span>
                      </button>
                    </div>
                    
                    {/* Collapsible Flow Content */}
                    {!isSequenceCollapsed && (
                      <div className="transition-all duration-300 ease-in-out">
                        {/* Flow Steps with enhanced styling */}
                        <div className="flex flex-col lg:flex-row items-center justify-center space-y-3 lg:space-y-0 lg:space-x-3">
                          {scenarioFlows[scenarioParam].flow.split(' → ').map((step, index, array) => (
                            <div key={index} className="flex items-center">
                              {/* Step with enhanced styling */}
                              <div className="group">
                                <div className="rounded-lg px-3 py-2 sm:px-4 sm:py-3 border bg-red-600/15 border-red-400/40 hover:border-red-300 hover:bg-red-600/25 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                                  <div className="text-center">
                                    <span className="font-medium text-white text-xs sm:text-sm lg:text-base leading-tight">
                                      {step.trim()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Arrow with enhanced styling */}
                              {index < array.length - 1 && (
                                <div className="flex-shrink-0 mx-1 sm:mx-2 lg:mx-3">
                                  {/* Mobile: Down arrow */}
                                  <div className="lg:hidden flex justify-center">
                                    <div className="text-lg sm:text-xl text-red-300 animate-pulse font-bold">
                                      ↓
                                    </div>
                                  </div>
                                  {/* Desktop: Right arrow */}
                                  <div className="hidden lg:flex justify-center">
                                    <div className="text-lg sm:text-xl text-red-300 animate-pulse font-bold">
                                      →
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Helper text with enhanced styling */}
                        <div className="text-center mt-4 sm:mt-6">
                          <div className="inline-flex items-center space-x-2 px-3 py-1 sm:px-4 sm:py-2 bg-blue-600/20 rounded-full text-xs text-blue-300 border border-blue-500/30">
                            <span>💡</span>
                            <span className="hidden sm:inline">Click on API bundles below to access detailed implementation guides</span>
                            <span className="sm:hidden">Bundles below for guides</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {filteredApis.length > 0 ? (
                  /* API Bundle Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApis.map((bundle, index) => {
                // Get the first API from the bundle to use for linking and display logic
                const firstApiId = bundle.apis[0];
                const firstApi = apis.find(api => api.id === firstApiId);
                const bundleHasLockedApis = bundle.apis.some(apiId => {
                  const api = apis.find(a => a.id === apiId);
                  return api && api.locked;
                });
                
                return (
                  <Link
                    key={index}
                    to={firstApi ? `/api/${generateSlug(firstApi.name)}` : '#'}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors block hover:bg-gray-750"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {bundleHasLockedApis && <LockClosedIcon className="h-5 w-5 text-red-500" />}
                        {bundle.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Show count of APIs in bundle */}
                        <span className="px-2 py-1 rounded text-xs font-medium text-white bg-blue-600">
                          {bundle.apis.length} APIs
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">
                      {bundle.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {bundle.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                      );
                    })}
                  </div>
                ) : (
                    /* No Results - Only show when filters have been confirmed */
                    <div className="text-center py-12">
                      <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-6">🔍❌</div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                          No APIs Found
                        </h3>
                        <p className="text-gray-400 mb-6">
                          We couldn't find any API bundles matching your current filter selection. Try adjusting your criteria for better results.
                        </p>
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-6">
                          <h4 className="text-amber-400 font-medium mb-2">💡 Suggestions</h4>
                          <ul className="text-sm text-amber-200 space-y-1 text-left">
                            <li>• Try selecting "All" in one or more filter categories</li>
                            <li>• Clear your search query if you have one</li>
                            <li>• Consider expanding your market selection</li>
                            <li>• Remove some specific filters to broaden results</li>
                          </ul>
                        </div>
                        <button
                          onClick={handleClearFilters}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          🧹 Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
        </div>
      </div>

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

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-80 bg-gray-800 text-white">
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
            <div className="p-4 overflow-y-auto h-full">
              {/* Filter Selection Header */}
              <div className="mb-6 pb-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-2">Filter Selection</h2>
                <p className="text-sm text-gray-400">Select your criteria and confirm to view matching APIs</p>
              </div>

              {/* Dynamic Scenario Filters or Default Filters */}
              {selectedScenarioConfig ? (
                // Render dynamic scenario-based filters
                Object.entries(selectedScenarioConfig.filters).map(([filterKey, filterConfig]) => (
                  <div key={filterKey} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                      {filterConfig.label}
                    </h3>
                    <div className="space-y-1">
                      {filterConfig.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterClick(option)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            selectedFilters.has(option)
                              ? 'bg-red-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span>{option}</span>
                          <span className="text-xs text-gray-400">
                            {getSidebarCounts[option] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Render default filters when no scenario is selected
                rawSidebarConfig.map((section) => (
                  <div key={section.label} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                      {section.label}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleFilterClick(item.label)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            selectedFilters.has(item.label)
                              ? 'bg-red-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-xs text-gray-400">
                            {getSidebarCounts[item.label] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Mobile Confirmation Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-700">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleConfirmFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    disabled={!hasFilterChanges}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      hasFilterChanges
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {hasConfirmedSelection ? '🔄 Update Results' : '🔍 Search APIs'}
                  </button>
                  
                  {hasConfirmedSelection && (
                    <button
                      onClick={() => {
                        handleClearFilters();
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                    >
                      ✨ Clear All Filters
                    </button>
                  )}
                </div>
                
                {hasFilterChanges && hasConfirmedSelection && (
                  <p className="text-xs text-amber-400 mt-2 text-center">
                    💡 You have unsaved filter changes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApisPage;