/**
 * Filter State Manager
 * 
 * Utility functions to manage user's filter state in sessionStorage
 * to preserve navigation context when moving between pages.
 * 
 * This allows users to return to their exact filter selections
 * when navigating back from API detail pages via breadcrumbs.
 */

const FILTER_STATE_KEY = 'hsbc_api_filter_state';

/**
 * Save the current filter state to sessionStorage
 * @param {Object} filterState - The complete filter state to save
 * @param {Object} filterState.selectedFilters - Currently selected filters
 * @param {string} filterState.scenarioId - The current scenario ID
 * @param {boolean} filterState.hasSearched - Whether the user has performed a search
 * @param {string} filterState.searchQuery - Current search query
 * @param {Object} filterState.expandedCategories - Which filter categories are expanded
 */
export const saveFilterState = (filterState) => {
  try {
    const stateToSave = {
      ...filterState,
      timestamp: Date.now(), // Add timestamp for cache invalidation if needed
      url: window.location.pathname + window.location.search // Save the exact URL
    };
    
    sessionStorage.setItem(FILTER_STATE_KEY, JSON.stringify(stateToSave));
    console.log('Filter state saved:', stateToSave);
  } catch (error) {
    console.warn('Failed to save filter state to sessionStorage:', error);
  }
};

/**
 * Load the saved filter state from sessionStorage
 * @returns {Object|null} - The saved filter state or null if none exists
 */
export const loadFilterState = () => {
  try {
    const savedState = sessionStorage.getItem(FILTER_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      console.log('Filter state loaded:', parsed);
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load filter state from sessionStorage:', error);
  }
  return null;
};

/**
 * Clear the saved filter state from sessionStorage
 */
export const clearFilterState = () => {
  try {
    sessionStorage.removeItem(FILTER_STATE_KEY);
    console.log('Filter state cleared');
  } catch (error) {
    console.warn('Failed to clear filter state from sessionStorage:', error);
  }
};

/**
 * Check if there is a saved filter state available
 * @returns {boolean} - True if there is a saved state, false otherwise
 */
export const hasFilterState = () => {
  try {
    return sessionStorage.getItem(FILTER_STATE_KEY) !== null;
  } catch (error) {
    console.warn('Failed to check filter state in sessionStorage:', error);
    return false;
  }
};

/**
 * Build a URL to navigate back to the saved filter page with preserved state
 * @returns {string} - The URL to navigate to, or '/scenarios' as fallback
 */
export const buildFilterPageUrl = () => {
  const savedState = loadFilterState();
  
  if (!savedState || !savedState.scenarioId) {
    return '/scenarios'; // Fallback to scenarios page
  }
  
  // If we have a saved URL that's still valid, use that
  if (savedState.url && savedState.url.includes('?scenario=')) {
    return savedState.url;
  }
  
  // Otherwise, build URL from scenario ID (this ensures consistency)
  return `/apis?scenario=${savedState.scenarioId}`;
};

/**
 * Get a human-readable description of the saved filter state
 * Used for logging and debugging purposes
 * @returns {string} - Description of the saved state
 */
export const getFilterStateDescription = () => {
  const savedState = loadFilterState();
  
  if (!savedState) {
    return 'No saved filter state';
  }
  
  const filterCount = Object.keys(savedState.selectedFilters || {}).length;
  const scenario = savedState.scenarioId || 'Unknown scenario';
  
  return `Scenario: ${scenario}, Filters: ${filterCount}, Searched: ${savedState.hasSearched}`;
};