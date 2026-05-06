import { ChevronDownIcon, Bars3Icon, XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const HsbcNavbar = ({ onFlowsToggle, onChatToggle }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const navClass = (path) =>
    `relative px-3 py-2 text-sm font-medium transition-colors ${
      currentPath === path ? 'text-white after:absolute after:left-3 after:right-3 after:-bottom-3 after:h-0.5 after:bg-red-500' : 'text-gray-300 hover:text-white'
    }`;

  return (
    <header className="bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Flows button + Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onFlowsToggle}
              className="text-gray-300 hover:text-white p-2 rounded-lg transition-colors"
              aria-label="Toggle flows sidebar"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 flex items-center justify-center transform rotate-45">
                <div className="w-4 h-4 bg-white transform -rotate-45"></div>
              </div>
              <span className="ml-3 text-xl font-bold">HSBC</span>
            </div>
          </div>

          {/* Center Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className={navClass('/')}>
              Home
            </a>
            <a href="/scenarios" className={navClass('/scenarios')}>
              APIs
            </a>
            <a href="/sdks" className={navClass('/sdks')}>
              SDKs
            </a>
            <a href="/financial-assistant" className={navClass('/financial-assistant')}>
              Financial Assistant
            </a>
            <a href="#" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Case Studies
            </a>
            <div className="relative">
              <button className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium flex items-center transition-colors">
                Tools
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </nav>

          {/* Right side - Search bar, Chat, Help, Login, Register */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-gray-800 rounded-lg px-3 py-2 w-64">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search or ask AI..."
                className="bg-transparent text-white placeholder-gray-400 flex-1 outline-none text-sm"
              />
              <kbd className="ml-2 px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">⌘K</kbd>
            </div>

            {/* Chat Button */}
            <button
              onClick={onChatToggle}
              className="text-gray-300 hover:text-white p-2 rounded-lg transition-colors"
              aria-label="Toggle chat panel"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
            </button>

            {/* Help, Login, Register */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Help
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Login
              </a>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Register
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              <a href="/" className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium">
                Home
              </a>
              <a href="/scenarios" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                APIs
              </a>
              <a href="/sdks" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                SDKs
              </a>
              <a href="/financial-assistant" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                Financial Assistant
              </a>
              <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                Case Studies
              </a>
              <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                Tools
              </a>
              <div className="border-t border-gray-700 pt-4">
                <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                  Help
                </a>
                <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                  Login
                </a>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mx-3 mt-2">
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HsbcNavbar;
