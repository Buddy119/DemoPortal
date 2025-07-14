import { Link, useNavigate } from 'react-router-dom';
import { apiCatalog } from '../data/apisConfig';
import { generateSlug } from '../utils/slugUtils';

const FrequentlyUsedApis = () => {
  const navigate = useNavigate();
  // Get the first 6 APIs from the catalog to display
  const apiData = apiCatalog.slice(0, 6);

  return (
    <section className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Frequently Used APIs</h2>
        </div>
        
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiData.map((api) => (
            <div 
              key={api.name} 
              className={`bg-gray-800 border border-gray-700 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:border-gray-600 hover:bg-gray-750 transform hover:-translate-y-1 ${
                api.locked ? 'opacity-75' : 'cursor-pointer'
              }`}
              onClick={() => !api.locked && navigate(`/api/${generateSlug(api.name)}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                {api.locked && (
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{api.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {api.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {api.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">{api.type}</span>
                {api.locked ? (
                  <span className="flex items-center text-gray-500 text-sm font-medium cursor-not-allowed">
                    Learn more
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                ) : (
                  <Link 
                    to={`/api/${generateSlug(api.name)}`}
                    className="flex items-center text-red-500 text-sm font-medium hover:text-red-400 focus:outline-none focus:text-red-400 transition-colors"
                    aria-label={`Learn more about ${api.name}`}
                  >
                    Learn more
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FrequentlyUsedApis;