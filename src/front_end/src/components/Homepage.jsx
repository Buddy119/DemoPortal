import { useState } from 'react';
import HsbcNavbar from './HsbcNavbar';
import HeroSection from './HeroSection';
import EasyIntegration from './EasyIntegration';
import FrequentlyUsedApis from './FrequentlyUsedApis';
import FlowsSidebar from './FlowsSidebar';
import ChatPanel from './ChatPanel';

const Homepage = () => {
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  const handleFlowsToggle = () => {
    setIsFlowsSidebarOpen(!isFlowsSidebarOpen);
  };

  const handleChatToggle = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <HsbcNavbar 
        onFlowsToggle={handleFlowsToggle}
        onChatToggle={handleChatToggle}
      />
      
      {/* Main Content */}
      <main className="relative">
        <HeroSection />
        <EasyIntegration />
        <FrequentlyUsedApis />
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

export default Homepage;