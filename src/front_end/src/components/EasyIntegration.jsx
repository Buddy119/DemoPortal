const EasyIntegration = () => {
  return (
    <section className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Easy integration</h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl">
            Sign up for a Sandbox account instantly and make your first API call today
          </p>
        </div>
        
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl">
          {/* First Card */}
          <div className="bg-gray-800 rounded-lg p-6 md:p-8 hover:bg-gray-700 transition-colors duration-200">
            <div className="flex flex-col items-start text-left">
              <div className="w-16 h-16 mb-6 flex items-center justify-start">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-left">Sign up for Sandbox instantly</h3>
              <p className="text-gray-400 text-sm md:text-base text-left">
                This will be a short description copy
              </p>
            </div>
          </div>
          
          {/* Second Card */}
          <div className="bg-gray-800 rounded-lg p-6 md:p-8 hover:bg-gray-700 transition-colors duration-200">
            <div className="flex flex-col items-start text-left">
              <div className="w-16 h-16 mb-6 flex items-center justify-start">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-left">Generate your API keys</h3>
              <p className="text-gray-400 text-sm md:text-base text-left">
                This will be a short description copy
              </p>
            </div>
          </div>

          {/* Third Card */}
          <div className="bg-gray-800 rounded-lg p-6 md:p-8 hover:bg-gray-700 transition-colors duration-200">
            <div className="flex flex-col items-start text-left">
              <div className="w-16 h-16 mb-6 flex items-center justify-start">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-left">Test your first call</h3>
              <p className="text-gray-400 text-sm md:text-base text-left">
                This will be a short description copy
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EasyIntegration;