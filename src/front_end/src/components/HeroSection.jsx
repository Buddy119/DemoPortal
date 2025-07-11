const HeroSection = () => {
  return (
    <section className="relative bg-gray-900 text-white py-16 md:py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800"></div>
      <div className="absolute inset-0 bg-gradient-radial from-red-600/20 via-transparent to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Start building with HSBC{' '}
          <span className="block sm:inline">
            APIs in{' '}
            <span className="text-red-500 font-extrabold relative">
              {'{minutes}'}
              <span className="absolute -inset-1 bg-red-500/20 blur-lg rounded-lg"></span>
            </span>
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto px-4">
          Sign up for a Sandbox account instantly and make your first API call today
        </p>
        
        <button 
          className="group relative bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 sm:px-10 rounded-lg text-base sm:text-lg transition-all duration-300 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:shadow-lg hover:shadow-red-500/25 transform hover:-translate-y-0.5"
          aria-label="Explore APIs"
        >
          <span className="relative z-10">Explore APIs</span>
          <svg className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
    </section>
  );
};

export default HeroSection;