import { apiData } from '/src/data/apis.js';
import { Card, CardHeader, CardTitle, CardContent } from '/src/components/ui/card.jsx';
import { Link, useLocation } from 'react-router-dom';
import { useHighlight } from '/src/hooks/useHighlight.js';

export default function ApiList() {
  const location = useLocation();
  const highlightId = location.hash.replace('#', '');

  return (
    <div className="space-y-4">
      {apiData.apis.map((api) => {
        const id = `${api.id}-card`;
        const ref = useHighlight(highlightId, id);
        return (
          <Link key={api.id} to={`/docs/${api.id}`} className="block">
            <Card ref={ref} id={id} className="hover:shadow">
              <CardHeader>
                <CardTitle>{api.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                <p className="font-mono text-sm">
                  <span className="font-semibold">{api.method}</span> {api.endpoint}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
