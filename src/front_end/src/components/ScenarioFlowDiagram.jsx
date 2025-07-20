import React from 'react';

const ScenarioFlowDiagram = ({ scenarioFlow, isVisible = true, isHighlighted = false }) => {
  if (!scenarioFlow) {
    return null;
  }

  // Split the flow by arrows and create individual steps
  const steps = scenarioFlow.flow.split(' → ').map((step, index) => step.trim());

  return (
    <div className={`transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
      <div className={`bg-gray-800 rounded-xl p-8 border transition-all duration-700 ${
        isHighlighted 
          ? 'border-red-500 shadow-2xl shadow-red-500/25 bg-gradient-to-br from-gray-800 to-gray-850' 
          : 'border-gray-700'
      }`}>
        {/* Flow Diagram Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">API Flow Diagram</h3>
          <p className="text-red-400 font-medium text-lg">{scenarioFlow.name}</p>
        </div>

        {/* Flow Steps */}
        <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Step */}
              <div className="group">
                <div className={`rounded-lg px-4 py-3 border transition-all duration-300 transform hover:scale-105 ${
                  isHighlighted 
                    ? 'bg-gray-650 border-red-400 hover:border-red-300 shadow-lg' 
                    : 'bg-gray-700 border-gray-600 hover:border-red-500 hover:bg-gray-650'
                }`}>
                  <div className="text-center">
                    <span className={`font-medium text-sm lg:text-base leading-tight ${
                      isHighlighted ? 'text-white' : 'text-white'
                    }`}>
                      {step}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow (except for last step) */}
              {index < steps.length - 1 && (
                <div className="flex-shrink-0">
                  {/* Mobile: Down arrow */}
                  <div className="lg:hidden flex justify-center">
                    <div className={`text-2xl transform transition-transform duration-300 hover:translate-y-1 ${
                      isHighlighted ? 'text-red-300 animate-pulse' : 'text-red-400'
                    }`}>
                      ↓
                    </div>
                  </div>
                  {/* Desktop: Right arrow */}
                  <div className="hidden lg:flex justify-center">
                    <div className={`text-2xl transform transition-transform duration-300 hover:translate-x-1 ${
                      isHighlighted ? 'text-red-300 animate-pulse' : 'text-red-400'
                    }`}>
                      →
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Helper Text */}
        <div className="text-center mt-8">
          <p className={`text-sm transition-colors duration-300 ${
            isHighlighted ? 'text-gray-300' : 'text-gray-400'
          }`}>
            Follow this recommended API sequence for optimal integration
          </p>
          {isHighlighted && (
            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-red-600/20 rounded-full text-xs text-red-300">
              <span>💡</span>
              <span>Click on APIs above to view detailed documentation</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioFlowDiagram;