import { apiGroups } from '/src/data/apiGroups.js';
import Accordion from '/src/components/ui/accordion.jsx';
import ApiCard from '/src/components/ApiCard.jsx';
import { useLocation } from 'react-router-dom';

export default function ApiList() {
  const location = useLocation();
  const highlightId = location.hash.replace('#', '');

  return (
    <div className="space-y-4">
      {apiGroups.map((group, idx) => (
        <Accordion key={group.title} title={group.title} defaultOpen={idx === 0}>
          {group.apis.map((api) => (
            <ApiCard key={api.id} api={api} highlightId={highlightId} />
          ))}
        </Accordion>
      ))}
    </div>
  );
}
