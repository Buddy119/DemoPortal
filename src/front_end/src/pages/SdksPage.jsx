import { useState } from 'react';
import HsbcNavbar from '../components/HsbcNavbar';
import FlowsSidebar from '../components/FlowsSidebar';
import ChatPanel from '../components/ChatPanel';
import sdkConfig from '../data/sdkConfig';

const SdksPage = () => {
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'github':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        );
      case 'react':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89s-.84 1.89-1.87 1.89c-1.03 0-1.87-.84-1.87-1.89s.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9s-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03s1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.37 1.95-1.47-.84-1.63-3.05-1.01-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1.01-5.63 1.46-.84 3.45.12 5.37 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26s-1.18-1.63-3.28-2.26c-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26s1.18 1.63 3.28 2.26c.25-.76.55-1.51.89-2.26m2.91-5.26c-.51-1.12-.92-2.05-1.15-2.68-.54-.08-1.18.06-1.76.64-.63.63-.8 1.57-.4 2.69.45-.21.98-.41 1.57-.58.25-.27.51-.53.74-.07m4.34 0c.23-.54.49-1.08.74-1.63.59.17 1.12.37 1.57.58.4-1.12.23-2.06-.4-2.69-.58-.58-1.22-.72-1.76-.64-.23.63-.64 1.56-1.15 2.68M12 9.06c-.51-.05-1.02-.08-1.53-.08-.51 0-1.02.03-1.53.08-.05.51-.08 1.02-.08 1.53 0 .51.03 1.02.08 1.53.51.05 1.02.08 1.53.08.51 0 1.02-.03 1.53-.08.05-.51.08-1.02.08-1.53 0-.51-.03-1.02-.08-1.53"/>
          </svg>
        );
      case 'html-js':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-10-3zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const ServerSideSDKCard = ({ sdk }) => (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
      <h3 className="text-white text-lg font-semibold mb-3">{sdk.title}</h3>
      <div className="flex items-center text-gray-400">
        {getIcon(sdk.icon)}
        <span className="ml-2 text-sm">{sdk.version}</span>
      </div>
    </div>
  );

  const WebSDKCard = ({ sdk }) => (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
      <h3 className="text-white text-lg font-semibold mb-3">{sdk.title}</h3>
      <div className="flex items-center text-gray-400">
        {getIcon(sdk.icon)}
        <span className="ml-2 text-sm">{sdk.stack || sdk.version}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">HSBC SDKs</h1>
          <p className="text-gray-400 text-lg">
            Libraries and tools for interacting with your HSBC integration.
          </p>
        </div>

        {/* Server-side SDKs Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Server-side SDKs</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            HSBC's server-side SDKs reduce the amount of work required to use HSBC's REST APIs.
            Find installation instructions and examples of API requests in our{' '}
            <a 
              href="#" 
              className="text-red-400 hover:text-red-300 underline"
            >
              introduction to server-side SDKs
            </a>{' '}
            guide.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sdkConfig.serverSide.map((sdk, index) => (
              <ServerSideSDKCard key={index} sdk={sdk} />
            ))}
          </div>
        </div>

        {/* Web SDKs Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Web SDKs</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            HSBC provides the following web client SDKs to enable integrations with{' '}
            <a 
              href="#" 
              className="text-red-400 hover:text-red-300 underline"
            >
              HSBC Elements
            </a>
            , our pre-built UI components, to create a payment form that lets you
            securely collect a customer's card details without handling the sensitive data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sdkConfig.web.map((sdk, index) => (
              <WebSDKCard key={index} sdk={sdk} />
            ))}
          </div>
        </div>
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

export default SdksPage;