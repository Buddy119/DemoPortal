import { useHighlight } from '../hooks/useHighlight.js';
import { useHighlightContext } from '../highlightContext.js';
import CopyButton from '../components/CopyButton.jsx';

const CurlBlock = ({ code, id }) => {
  const { activeId } = useHighlightContext();
  const ref = useHighlight(activeId, id);

  return (
    <div ref={ref} id={id} className="relative mb-8">
      <pre className="bg-gray-900 text-gray-100 text-sm rounded p-4 overflow-x-auto">
        {code}
      </pre>
      <CopyButton className="absolute top-2 right-2" text={code} />
    </div>
  );
};

export default CurlBlock;
