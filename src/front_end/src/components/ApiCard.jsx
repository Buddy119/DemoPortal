import { Link } from 'react-router-dom';
import { useHighlight } from '/src/hooks/useHighlight.js';

export default function ApiCard({ api, highlightId }) {
  const id = `${api.id}-card`;
  const ref = useHighlight(highlightId, id);
  return (
    <Link to={`/docs/${api.id}`} className="block">
      <div
        ref={ref}
        id={id}
        className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
      >
        <h4 className="text-base font-semibold">{api.name}</h4>
        <p className="text-sm text-gray-600">{api.description}</p>
        <div className="mt-1 flex gap-2 items-center">
          <span className="inline-block px-2 py-1 bg-blue-700 text-white text-xs rounded">
            {api.method}
          </span>
          <code className="text-xs">{api.endpoint}</code>
        </div>
      </div>
    </Link>
  );
}
