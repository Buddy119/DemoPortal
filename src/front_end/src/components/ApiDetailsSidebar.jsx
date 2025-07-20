import React, { useState, useMemo } from 'react';
import apiBundles from '../data/apiBundles.js';
import apis from '../data/apisFlat.js';
import { generateSlug } from '../utils/slugUtils.js';

export default function ApiDetailsSidebar({ currentApi }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get the current API's bundle and the corresponding bundle object
  const currentBundle = useMemo(() => {
    if (!currentApi?.bundle) return null;
    return apiBundles.find(bundle => bundle.name === currentApi.bundle);
  }, [currentApi]);

  // Get all APIs in the current bundle
  const bundleApis = useMemo(() => {
    if (!currentBundle) return [];
    return currentBundle.apis.map(apiId => apis.find(api => api.id === apiId)).filter(Boolean);
  }, [currentBundle]);

  // Filter APIs based on search term
  const filteredApis = useMemo(() => {
    if (!searchTerm) return bundleApis;
    return bundleApis.filter(api => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bundleApis, searchTerm]);

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'POST': return 'bg-green-600';
      case 'GET': return 'bg-blue-600';
      case 'PUT': return 'bg-yellow-600';
      case 'DELETE': return 'bg-red-600';
      case 'PATCH': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full bg-gray-800 border-r border-gray-700 h-full overflow-y-auto">
      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search the docs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute left-3 top-2.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </div>
          
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Introduction
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Authentication
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Overview
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Tutorial
          </a>
        </nav>

        {/* Dynamic Bundle Section */}
        {currentBundle ? (
          <div className="mt-8">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {currentBundle.name}
            </div>
            
            {/* Bundle APIs */}
            <div className="space-y-1">
              {filteredApis.length > 0 ? (
                filteredApis.map((api) => {
                  const isActive = api.id === currentApi.id;
                  return (
                    <a
                      key={api.id}
                      href={`/api/${generateSlug(api.name)}`}
                      className={`flex items-center px-3 py-2 text-sm rounded group ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {api.method && (
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded mr-2 ${getMethodColor(api.method)}`}>
                          {api.method}
                        </span>
                      )}
                      <span className="flex-1 truncate">{api.name}</span>
                    </a>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">
                  {searchTerm ? 'No APIs match your search.' : 'No APIs found in this bundle.'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 px-3 py-2 text-sm text-gray-400">
            API bundle information not available.
          </div>
        )}

        {/* Additional Bundle Information */}
        {currentBundle && (
          <div className="mt-8 p-4 bg-gray-700 rounded-lg">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Bundle Info
            </div>
            <p className="text-sm text-gray-300 mb-2">
              {currentBundle.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {currentBundle.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}