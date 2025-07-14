import React, { useState } from 'react';
import { apiCatalog } from '../data/apisConfig.js';
import { generateSlug } from '../utils/slugUtils.js';

export default function ApiDetailsSidebar({ currentApi }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredApis = apiCatalog.filter(api => 
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Corporate Banking Section */}
        <div className="mt-8">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Corporate Banking
          </div>
          
          {/* Funds Confirmation Subsection */}
          <div className="mb-4">
            <div className="flex items-center px-3 py-2 text-sm text-white font-medium">
              <span>Funds Confirmation</span>
              <svg className="w-4 h-4 ml-auto transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="ml-4 space-y-1">
              {filteredApis
                .filter(api => api.name.includes('Funds Confirmation'))
                .map((api) => {
                  const isActive = api.name === currentApi.name;
                  return (
                    <a
                      key={api.name}
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
                })}
            </div>
          </div>

          {/* Other APIs */}
          <div className="space-y-1">
            {filteredApis
              .filter(api => !api.name.includes('Funds Confirmation') && api.tags.includes('Corporate'))
              .map((api) => {
                const isActive = api.name === currentApi.name;
                return (
                  <a
                    key={api.name}
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
              })}
          </div>
        </div>

        {/* Additional Navigation Items */}
        <div className="mt-8 space-y-1">
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Account Information API
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Collections Services API
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Transfer Agency - Payment API
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Treasury - Account Information
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            FA - ETF Order API
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
            Sandbox Keys
          </a>
        </div>
      </div>
    </div>
  );
}