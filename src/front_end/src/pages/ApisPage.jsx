import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, LockClosedIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { rawSidebarConfig, apiCatalog, marketOptions } from '../data/apisConfig';
import { generateSlug } from '../utils/slugUtils';
import HsbcNavbar from '../components/HsbcNavbar';
import FlowsSidebar from '../components/FlowsSidebar';
import ChatPanel from '../components/ChatPanel';

const ApisPage = () => {
  const [searchParams] = useSearchParams();
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(new Set(['All']));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All Markets');
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  
  // Handle URL filter parameter for breadcrumb navigation
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      // Check if the filter parameter matches a valid category
      const isValidFilter = rawSidebarConfig.some(section => 
        section.items.some(item => item.label === filterParam)
      );
      
      if (isValidFilter) {
        setSelectedFilters(new Set([filterParam]));
      }
    }
  }, [searchParams]);

  // Filter APIs based on all active filters
  const filteredApis = useMemo(() => {
    let filtered = apiCatalog;

    // Filter by market
    if (selectedMarket !== 'All Markets') {
      filtered = filtered.filter(api => api.market === selectedMarket);
    }

    // Filter by search query (API name only)
    if (searchQuery) {
      filtered = filtered.filter(api => 
        api.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sidebar selections
    if (!selectedFilters.has('All') && selectedFilters.size > 0) {
      filtered = filtered.filter(api => {
        // Check each selected filter against the API
        for (const selectedFilter of selectedFilters) {
          // Special handling for general filters
          if (selectedFilter === 'Spotlight' && api.locked) return true;
          if (selectedFilter === 'Get Started' && !api.locked) return true;
          
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
              if (api.tags.includes(filterValue)) return true;
              break;
            case 'type':
              if (api.type === filterValue) return true;
              break;
            case 'special':
              // Already handled above
              break;
          }
        }
        return false;
      });
    }

    return filtered;
  }, [selectedFilters, searchQuery, selectedMarket]);

  // Calculate counts for sidebar items
  const getSidebarCounts = useMemo(() => {
    const counts = {};
    
    rawSidebarConfig.forEach(section => {
      section.items.forEach(item => {
        let count = 0;
        
        // Filter APIs by market first (or show all if "All Markets" is selected)
        const marketFilteredApis = selectedMarket === 'All Markets' 
          ? apiCatalog 
          : apiCatalog.filter(api => api.market === selectedMarket);
        
        // Special handling for general filters
        if (item.label === 'All') {
          count = marketFilteredApis.length;
        } else if (item.label === 'Get Started') {
          count = marketFilteredApis.filter(api => !api.locked).length;
        } else if (item.label === 'Spotlight') {
          count = marketFilteredApis.filter(api => api.locked).length;
        } else {
          // Use the filterKey from the section to determine how to count
          const filterValue = item.value || item.label;
          
          switch (section.filterKey) {
            case 'tags':
              count = marketFilteredApis.filter(api => api.tags.includes(filterValue)).length;
              break;
            case 'type':
              count = marketFilteredApis.filter(api => api.type === filterValue).length;
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
    
    return counts;
  }, [selectedMarket]);

  const handleFilterClick = (filterLabel) => {
    setSelectedFilters(prev => {
      // If clicking "All", clear everything and set only "All"
      if (filterLabel === 'All') {
        return new Set(['All']);
      }
      
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
            {rawSidebarConfig.map((section) => (
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
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span className="text-sm">Filters</span>
              </button>

              {/* Search Bar */}
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

              {/* Market Selector */}
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

              {/* Results Counter */}
              <div className="hidden md:block text-sm text-gray-400">
                Showing {filteredApis.length === 0 ? '0' : '1'}–{filteredApis.length} of {apiCatalog.length} APIs
              </div>
            </div>
          </div>

          {/* API Cards Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApis.map((api, index) => (
                <Link
                  key={index}
                  to={`/api/${generateSlug(api.name)}`}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors block hover:bg-gray-750"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {api.locked && <LockClosedIcon className="h-5 w-5 text-red-500" />}
                      {api.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getTypeBadgeColor(api.type)}`}>
                        {getTypeLabel(api.type)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4">
                    {api.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {api.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            
            {filteredApis.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No APIs found matching your criteria.</p>
              </div>
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
              {rawSidebarConfig.map((section) => (
                <div key={section.label} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          handleFilterClick(item.label);
                          setIsMobileFilterOpen(false);
                        }}
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApisPage;