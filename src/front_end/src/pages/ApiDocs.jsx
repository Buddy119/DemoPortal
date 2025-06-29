import { useParams } from 'react-router-dom';
import { apiData } from '../data/apis.js';
import ApiOverview from '../sections/ApiOverview.jsx';
import Endpoint from '../sections/Endpoint.jsx';
import ParamTable from '../sections/ParamTable.jsx';
import CurlBlock from '../sections/CurlBlock.jsx';
import ResponseBlock from '../sections/ResponseBlock.jsx';
import FieldTable from '../sections/FieldTable.jsx';

const ApiDocs = () => {
  const { apiId } = useParams();
  const api = apiData.apis.find((a) => a.id === apiId);
  if (!api) return <p>API not found</p>;

  return (
    <div className="prose max-w-none">
      <ApiOverview api={api} />
      <Endpoint api={api} />
      <ParamTable params={api.parameters} />
      <CurlBlock code={api.curlExample} id={`${api.id}-curl`} />
      <ResponseBlock code={api.responseExample} id={`${api.id}-response`} />
      <FieldTable fields={api.fields} />
    </div>
  );
};

export default ApiDocs;
